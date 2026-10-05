// THE KIND OF EACH SCORED ITEM (the deep review of the prediction record, deep-review-log.md 5 Oct 10:16 UK: hand labels from
// each test's results file, grade B; the maintainer's 'Go ahead' of 5 Oct on its proposals). scorecard.mjs prints the base
// rate and Brier by kind. A test registered from 5 Oct names its items' kinds in its Credence section ("**Kinds:** 1 ATTRIB;
// 2 SIZE"), which takes precedence over this table; an item in neither is WHOLE (a whole-test credence) or UNTAGGED.
//   NOHARM  a no-material-harm or safety read          EFFECT  a gain, a harm or an effect shows
//   ATTRIB  which cause, share or split carries it      SIZE    a measured or deterministic quantity against a threshold
//   CTRL    a reproduction, identity or control         WHOLE   a whole-test credence
export const KINDS = ['NOHARM', 'EFFECT', 'ATTRIB', 'SIZE', 'CTRL', 'WHOLE'];
// keyed by the scorecard's short test name (the TESTS entry's name before its first space)
export const ITEM_KINDS = {
 '7e':{1:'SIZE',2:'SIZE',3:'SIZE',4:'SIZE',5:'NOHARM',6:'EFFECT',7:'CTRL',8:'SIZE',9:'SIZE'},
 '7r':{1:'EFFECT',2:'CTRL',3:'EFFECT',4:'ATTRIB',5:'EFFECT'},
 '7s':{1:'CTRL',2:'ATTRIB',3:'NOHARM',4:'SIZE',5:'SIZE'},
 '7t':{1:'CTRL',2:'ATTRIB',3:'ATTRIB',4:'ATTRIB',5:'ATTRIB',6:'ATTRIB',7:'SIZE',8:'SIZE',9:'EFFECT',10:'EFFECT',11:'EFFECT',12:'SIZE',13:'NOHARM',14:'EFFECT',15:'SIZE',16:'SIZE',17:'ATTRIB'},
 '7v':{1:'EFFECT',2:'NOHARM',3:'ATTRIB',4:'EFFECT',5:'EFFECT',6:'EFFECT',7:'CTRL',8:'SIZE',10:'NOHARM',11:'SIZE',12:'SIZE',13:'SIZE'},
 '7w':{1:'SIZE',2:'EFFECT',3:'CTRL',4:'NOHARM',5:'SIZE'},
 '7x':{1:'SIZE',2:'SIZE',3:'CTRL',4:'CTRL'},
 '7z':{1:'EFFECT',2:'SIZE',3:'NOHARM',4:'CTRL'},
 '7y':{1:'EFFECT',2:'ATTRIB',3:'SIZE',4:'NOHARM',5:'EFFECT'},
 '7aa':{1:'EFFECT',2:'EFFECT',3:'NOHARM',4:'EFFECT',5:'EFFECT',6:'NOHARM'},
 '7ab':{1:'NOHARM',2:'NOHARM',3:'EFFECT',4:'EFFECT',5:'NOHARM'},
 '7ac':{1:'ATTRIB',2:'ATTRIB',3:'ATTRIB'},
 '7ad':{1:'SIZE',2:'SIZE',3:'SIZE',4:'SIZE'},
 '7ae':{1:'SIZE',2:'SIZE',3:'SIZE'},
 '7af':{1:'NOHARM',2:'NOHARM'},
 '7ag':{1:'NOHARM',2:'NOHARM',3:'ATTRIB'},
 'P':{1:'NOHARM',2:'NOHARM',3:'NOHARM',4:'NOHARM',5:'NOHARM',6:'SIZE',7:'ATTRIB'},
 '7ah':{1:'NOHARM',2:'NOHARM',3:'NOHARM',4:'NOHARM',5:'SIZE',7:'NOHARM',8:'NOHARM'},
 '7ai':{1:'SIZE',2:'SIZE'},
 '7ak':{1:'ATTRIB',2:'ATTRIB',3:'ATTRIB',4:'SIZE'},
 '7al':{1:'SIZE'},
 '7am':{1:'SIZE',2:'SIZE',3:'SIZE'},
 '7ap':{1:'ATTRIB',2:'SIZE',3:'CTRL'},
 '7aq':{1:'SIZE',2:'SIZE'},
 '7ar':{1:'ATTRIB',2:'ATTRIB',3:'ATTRIB'},
 '7as':{1:'NOHARM',2:'SIZE',3:'ATTRIB'},
 '7at':{1:'SIZE',2:'SIZE',3:'ATTRIB',4:'ATTRIB'},
 '7au':{1:'ATTRIB',2:'NOHARM'},
 'ADOPT-PI':{1:'NOHARM',2:'EFFECT'},
 'COV-B-STEP':{1:'NOHARM',2:'NOHARM',3:'ATTRIB'},
 'HYB':{1:'ATTRIB'},   // the split of ADOPT-PI's gain between the read and the tables (diag-hyb.md; labelled at its read)
 'EDGE':{1:'ATTRIB',2:'ATTRIB'},   // which snap edge carries the read's gain, on each table (diag-edge.md; labelled at its read)
};
