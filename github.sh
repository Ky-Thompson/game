#!/bin/sh

if [ "$TRAVIS_PULL_REQUEST" != "false" ] ; then
	curl -H "Authorization: token ${GITHUB_TOKEN}" -X POST \
	-d "{\"body\": \"## <img src=\\\"https:\/\/d4yt8xl9b7in.cloudfront.net\/assets\/home\/logotype-heroku.png\\\" height=\\\"20px\\\"> Staging deploy \\n https:\/\/caleb-sophia-madrid-dev.herokuapp.com\/\"}" \
	"https://api.github.com/repos/${TRAVIS_REPO_SLUG}/issues/${TRAVIS_PULL_REQUEST}/comments"
fi

