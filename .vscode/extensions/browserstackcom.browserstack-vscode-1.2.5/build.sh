npm run compile
if [[ ! -z "$BASE_DOMAIN" ]]; then
    echo Building extension with base domain https://$BASE_DOMAIN
    sed -i'' -e 's/live.browserstack.com/'"$BASE_DOMAIN"'/' out/constants.js
fi
