
const API_URL = 'https://cfw-takehome.developers.workers.dev/api/variants'
const COOKIE_NAME = '_variant'

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})
/**
 * Respond with hello worker text
 * @param {Request} request
 */
async function handleRequest(request) {
    // get variants
    const variants = await getVariants()
    
    // get URL from persisted cookie
    let variantURL = getCookie(request, COOKIE_NAME)

    let isCookiePresent = variantURL ? true : false

    if (!isCookiePresent) {
      variantURL = getVariantURL(variants)
    }

    // Fetch and Return the response
    const variantResponse = await fetch(variantURL)

    const HTMLBody = new HTMLRewriter()
    .on('title', new MetaRewriter())
    .on('p#description', new BodyRewriter())
    .on('a#url', new LinkRewriter())

    const response = new Response(HTMLBody.transform(variantResponse).body, variantResponse)
    
    if (!isCookiePresent) {
      // Persist the variant URL
      response.headers.append('Set-Cookie', `${COOKIE_NAME}=${variantURL}; HttpOnly; path=/`)
      isCookiePresent = true
    }
    
    return response
  
}

async function getVariants() {
    const response = await fetch(API_URL)
    const JSONResponse = await response.json()
    
    return JSONResponse.variants;
}

// Choosing based on the number of variants and equal distribution
function getVariantURL(variants) {

  let distribution = new Array(variants.length).fill(Number((1/variants.length).toFixed(2)))

  const rand = (Math.random() * (variants.length - 1)).toFixed(2)
  let acc = 0
  distribution = distribution.map(weight => (acc = acc + weight))
  return variants[distribution.findIndex(priority => priority > rand)]
}

// All the writers

class MetaRewriter {
  element(el) {
      el.before('<meta charset="utf-8">', { html: true })
      el.prepend('Rishi\'s CloudFlare Internship Coding Challenge')
  }
}

class BodyRewriter {
    element(el) {
        el.setInnerContent('Hi! This is my attempt at the CloudFlare\'s Summer 2020 Internship Coding Challenge.')
    }
}

class LinkRewriter {
  element(el) {
      el.setAttribute('href', 'http://rishiraj.co')
      el.setInnerContent('Visit my website')
  }
}

// From https://developers.cloudflare.com/workers/templates/#ab_testing
/**
 * Grabs the cookie with name from the request headers
 * @param {Request} request incoming Request
 * @param {string} name of the cookie to grab
 */
function getCookie(request, name) {
  let result = null
  let cookieString = request.headers.get('Cookie')
  if (cookieString) {
    let cookies = cookieString.split(';')
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim()
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1]
        result = cookieVal
      }
    })
  }
  return result
}
