#!/usr/bin/env python3
"""
Turn a published BlackRock capital market assumptions workbook into the app's risk-tier table.

Written in Python rather than Node because the parsing is a zip of XML and Python's stdlib reads both;
openpyxl is deliberately not used (it is not installed, and a build step that needs a pip install is a
build step that rots). Emits cma-gbp.json, which the .mjs tests consume.

Three things it does that are not obvious:

1.  Fits sigma_param. BlackRock publish a 25th and 75th percentile at seven horizons. The fit is done
    in LOG space, because that is the space the engine's sigmas live in - it draws
    exp(ln(1+real) + sp.z_path + sigma.z_year), so both are sigmas of a log return:

        sigma_u_log(T)  =  [ ln(1+p75) - ln(1+p25) ] / 1.349
        sigma_param^2   =  sigma_u_log(T)^2  -  sigma_log^2 / T

    That residual comes out flat across horizons for the core assets, which is the evidence that it is a
    horizon-free quantity and can therefore be evaluated at 45 or 60 years where no published figure
    exists.

2.  Deflates. The workbook is nominal; the engine is real throughout. real = (1+nominal)/(1+i) - 1.

3.  Blends. The app's tiers are equity-weight buckets, not named assets, so each tier is a two-asset
    blend using the published correlation. Note the assumption in blend_sigma_param: it combines the two
    sigma_params with the same correlation as their returns, which probably UNDERSTATES the result,
    because being wrong about one equilibrium usually means being wrong about the other. Stated here
    rather than buried, since it is the least defensible number in the file.
"""
import zipfile, xml.etree.ElementTree as ET, json, math, sys, os

NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
HORIZONS = [5, 7, 10, 15, 20, 25, 30]
EXP = dict(zip(HORIZONS, 'EFGHIJK'))
LO  = dict(zip(HORIZONS, 'LMNOPQR'))
HI  = dict(zip(HORIZONS, 'STUVWXY'))
IQR_Z = 1.3489795003921634          # width of the interquartile range of a standard normal

# the app's own tier definitions, mirrored here so the mapping is explicit rather than implied
EQUITY_WEIGHTS = [
    ('High Risk', 0.90), ('Medium/High Risk', 0.70), ('Medium Risk', 0.50),
    ('Medium/Low Risk', 0.30), ('Low Risk', 0.10), ('Cash Equivalents', 0.00),
]
LABELS = {
    'High Risk': 'Highest: 80–100% Equities',
    'Medium/High Risk': 'High: 60–80% Equities',
    'Medium Risk': 'Medium: 40–60% Equities',
    'Medium/Low Risk': 'Medium/Low: 20–40% Equities',
    'Low Risk': 'Low: High interest Cash Savings, Fixed Income, Bonds',
    'Cash Equivalents': 'Instant cash savings/money market',
}


def load(path):
    z = ET.fromstring
    Z = zipfile.ZipFile(path)
    sst = []
    for si in z(Z.read('xl/sharedStrings.xml')).findall(f'{NS}si'):
        sst.append(''.join(t.text or '' for t in si.iter(f'{NS}t')))

    def cell(c):
        t, v = c.get('t'), c.find(f'{NS}v')
        return None if v is None else (sst[int(v.text)] if t == 's' else v.text)

    rows = []
    for row in z(Z.read('xl/worksheets/sheet1.xml')).iter(f'{NS}row'):
        d = {}
        for c in row.findall(f'{NS}c'):
            col = ''.join(ch for ch in c.get('r') if ch.isalpha())
            val = cell(c)
            if val not in (None, ''):
                d[col] = val
        if d:
            rows.append(d)
    return rows


def asset_record(c):
    """Expected return per horizon, volatility, and the fitted sigma_param. All in percentage points."""
    vol = float(c['Z']) * 100
    exp = {t: float(c[EXP[t]]) * 100 for t in HORIZONS if c.get(EXP[t])}
    band = {}
    fits = []
    fits_by = {}
    for t in HORIZONS:
        lo, hi = c.get(LO[t]), c.get(HI[t])
        if not lo or not hi:
            continue
        lo, hi = float(lo) * 100, float(hi) * 100
        band[t] = {'p25': lo, 'p75': hi}
        # Log space, to match how the engine consumes both sigmas. Fitting in simple-return space and
        # then feeding the result in as a log sigma inflates it, and shows up as an upper percentile
        # that is systematically too high while the lower one still looks fine.
        spread_log = (math.log(1 + hi / 100) - math.log(1 + lo / 100)) / IQR_Z
        resid = spread_log ** 2 - ((vol / 100) ** 2) / t
        val = math.sqrt(resid) * 100 if resid > 0 else 0.0
        fits.append(val)
        fits_by[t] = val
    return {
        'name': c.get('C', ''), 'index': c.get('D', ''), 'volatility': vol,
        'expected': exp, 'band': band,
        'sigmaParam': (sum(fits) / len(fits)) if fits else 0.0,
        'sigmaParamByHorizon': fits_by,
        # how flat the fit is across horizons: the evidence for treating it as horizon-free
        'sigmaParamSpread': (max(fits) - min(fits)) if fits else 0.0,
        'corrEquities': float(c['AB']) * 100 / 100 if c.get('AB') else None,
    }


def blend(w, e, b, key, horizon):
    return w * e['expected'][horizon] + (1 - w) * b['expected'][horizon]


def blend_vol(w, se, sb, rho):
    return math.sqrt((w * se) ** 2 + ((1 - w) * sb) ** 2 + 2 * w * (1 - w) * rho * se * sb)


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else \
        '/root/.claude/uploads/2a53f41c-129c-59b0-b644-606b6facdf9e/81794b64-blackrock-capital-market-assumptions.xlsx'
    currency = os.environ.get('CMA_CCY', 'GBP')
    inflation = float(os.environ.get('CMA_INFLATION', '2.5'))
    horizon = int(os.environ.get('CMA_HORIZON', '30'))
    eq_name = os.environ.get('CMA_EQUITY', 'Global ex-UK large cap equities')
    bd_name = os.environ.get('CMA_BOND', 'UK gilts (all maturities)')
    cash_name = os.environ.get('CMA_CASH', 'UK cash')

    rows = load(src)
    assets = {}
    for c in rows[3:]:
        if c.get('A') == currency and c.get('C') and c.get('Z') is not None:
            assets[c['C']] = asset_record(c)

    for n in (eq_name, bd_name, cash_name):
        if n not in assets:
            sys.exit(f'asset not found in {currency}: {n!r}\navailable: {sorted(assets)}')

    e, b, cash = assets[eq_name], assets[bd_name], assets[cash_name]
    rho = b['corrEquities']
    deflate = lambda nom: ((1 + nom / 100) / (1 + inflation / 100) - 1) * 100

    tiers = {}
    for key, w in EQUITY_WEIGHTS:
        if w == 0.0:
            nom, vol, sp = cash['expected'][horizon], cash['volatility'], cash['sigmaParamByHorizon'][horizon]
        else:
            nom = blend(w, e, b, 'expected', horizon)
            vol = blend_vol(w, e['volatility'], b['volatility'], rho)
            sp = blend_vol(w, e['sigmaParamByHorizon'][horizon], b['sigmaParamByHorizon'][horizon], rho)
        tiers[key] = {
            'label': LABELS[key],
            'real': round(deflate(nom), 2),
            'nominal': round(nom, 2),
            'volatility': round(vol, 2),
            'sigmaParam': round(sp, 2),
        }

    # the tier table is only coherent if risk falls as the bond weight rises
    vols = [tiers[k]['volatility'] for k, w in EQUITY_WEIGHTS if w > 0]
    monotonic = all(vols[i] > vols[i + 1] for i in range(len(vols) - 1))

    out = {
        'source': 'BlackRock Capital Market Assumptions',
        'asOf': '2026-06-30', 'published': '2026-08', 'expires': '2027-08',
        'disclosure': 'BII0826-5810213-EXP0827',
        'currency': currency, 'horizonYears': horizon, 'inflationUsed': inflation,
        'equityProxy': eq_name, 'bondProxy': bd_name, 'cashProxy': cash_name,
        'correlationEquityBond': round(rho, 4),
        'monotonicVolatility': monotonic,
        'tiers': tiers,
        # kept for the validation test: it checks the engine reproduces these published percentiles
        'assets': {n: a for n, a in assets.items() if n in (eq_name, bd_name, cash_name,
                                                           'UK large cap equities', 'Emerging large cap equities')},
    }
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cma-gbp.json')
    with open(dest, 'w') as f:
        json.dump(out, f, indent=2)

    print(f'{out["source"]} · {currency} · as of {out["asOf"]} · {horizon}yr · deflated at {inflation}%')
    print(f'equity {eq_name!r}  bond {bd_name!r}  rho {rho:+.3f}')
    print(f'volatility monotonic in equity weight: {monotonic}')
    print(f'\n{"tier":22} {"real":>6} {"nominal":>8} {"vol":>7} {"sigmaParam":>11}')
    for k, _ in EQUITY_WEIGHTS:
        t = tiers[k]
        print(f'{k:22} {t["real"]:6.2f} {t["nominal"]:8.2f} {t["volatility"]:7.2f} {t["sigmaParam"]:11.2f}')
    print(f'\nsigma_param fit quality (spread across the seven horizons, pp):')
    for n, a in out['assets'].items():
        print(f'  {n[:42]:44} {a["sigmaParam"]:5.2f}  +/- {a["sigmaParamSpread"]:4.2f}')
    print(f'\nwrote {dest}')


if __name__ == '__main__':
    main()
