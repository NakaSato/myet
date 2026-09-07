#!/usr/bin/env bash
# Re-downloads every official IELTS PDF from ielts.org into resources/.
# Source page:
#   https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test
set -euo pipefail
cd "$(dirname "$0")/../resources"

CDN=https://ielts.org/cdn
mkdir -p guides academic-writing academic-reading listening

get() { # get <dest> <url>
  local code
  code=$(curl -sL -w "%{http_code}" -o "$1" "$2")
  if [ "$code" != "200" ] || [ "$(file -b --mime-type "$1")" != "application/pdf" ]; then
    echo "  FAILED ($code) $2" >&2; rm -f "$1"; return 1
  fi
  echo "  ok  $1"
}

echo "guides"
get guides/ielts-writing-band-descriptors.pdf  "$CDN/Guides/ielts-writing-band-descriptors.pdf"
get guides/ielts-speaking-band-descriptors.pdf "$CDN/ielts-guides/ielts-speaking-band-descriptors.pdf"

echo "academic-writing"
get academic-writing/ielts-academic-writing-example-responses.pdf \
  "$CDN/computer-delivered-sample-tests-academic-writing/ielts-academic-writing-example-responses-to-parts-1-and-2-with-band-scores-and-examiner-comments.pdf"
get academic-writing/ielts-academic-writing-sample-tasks-2023.pdf \
  "$CDN/Sample-tests/ielts-academic-writing-sample-tasks-2023.pdf"

echo "academic-reading (answer keys)"
RB="$CDN/computer-delivered-sample-tests-academic-reading/ielts-academic-reading-computer-delivered"
for t in multiple-choice-one-answer multiple-choice-more-than-one-answer \
         identifying-information-true-flase-not-given note-completion table-completion \
         matching-features summary-completion-selecting-words-from-text \
         summary-completion-selecting-from-list-of-words-or-phrases \
         sentence-completion matching-sentence-endings; do
  get "academic-reading/$t-answer-key.pdf" "$RB-$t-answer-key.pdf"
done

echo "listening (answer keys + tapescripts)"
LB="$CDN/computer-delivered-sample-tests-listening/ielts-listening-computer-delivered"
for t in multiple-choice-one-answer multiple-choice-more-than-one-answer \
         plan-map-diagram-labelling note-completion table-completion \
         flow-chart-completion sentence-completion short-answer; do
  get "listening/$t-answer-key.pdf" "$LB-$t-answer-key.pdf"
  get "listening/$t-transcript.pdf" "$LB-$t-transcript.pdf"
done

echo
echo "$(find . -name '*.pdf' | wc -l | tr -d ' ') PDFs in $(pwd)"
