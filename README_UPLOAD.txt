Fishing Dashboard — DEPLOY v21.1.0 (combined restore + locked score)

UPLOAD στη ρίζα GitHub (Replace / Add):
  index.html
  style.css
  app.js
  score_rod.png          (ΝΕΟ — locked gauge με καλάμι-δείκτη)
  activity_body.jpg      (ΝΕΟ — χωρίς baked τίτλο)

ΜΗΝ σβήσεις άλλα assets (tech cards, moon, sun, fish, κλπ.)
ΜΗΝ πειράξεις τις Τεχνικές — μένουν όπως είναι.

Μετά το commit:
  Netlify → Deploy without cache
  iPhone → ιδιωτική περιήγηση

Τι διορθώνει:
  - Hero ήλιος full-bleed σε όλο το widget
  - Score = locked καλάμι-δείκτης
  - Activity τίτλος από κώδικα, χωρίς crop τίτλου
  - Πίεση/Παλίρροιες χωρίς διπλό frame (SVG)
  - Σελήνη restore
  - Θάλασσα/Παλίρροιες ίσα ύψη
  - Weather premium SVG κυκλικά icons
  - Alerts μεγαλύτερα icons για κινητό
  - Τεχνικές ΑΘΙΚΤΕΣ

Εκκρεμεί μετά (μόνο αν χρειαστεί από iPhone screenshot):
  - photoreal weather icons αν τα SVG δεν αρκούν
  - custom PNG alerts icons
