#!/bin/sh
name=$1
cat mail.html |mutt -s "[XMatrix Studio]Verification Code" -e 'set content_type="text/html"' ${name}
