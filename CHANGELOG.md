### 0.1.1 / 2014-12-15

* Fix race condition when using context takeover, where adjacent messages have
  data listeners bound at the same time and end up duplicating output
* Use `DeflateRaw.flush()` correctly on v0.10 so that optimal compression is
  achieved

### 0.1.0 / 2014-12-13

* Initial release
