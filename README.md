# Simple  server side node.js that consumes Expedia.com hotel offer

Expedia API:
https://offersvc.expedia.com/offers/v2/getOffers?scenario=deal-finder&page=foo&uid=foo&productType=Hotel

Url:
https://powerful-bastion-38270.herokuapp.com

frameworks:

1.Express.js: To handle requests

2.ejs: Generate Dynamic content

# How It Works:

Initial home page renders information about the 50 hotels offers fetched from expedia api, the user can then make a search or filter hotel
offers which in turn generates another at most 50 hotel offers, also the user can then click to view detailed inofrmation about each hotel offer.
Since the api request to a specific hotel is unknown, the last regular or search request will be temporarily stored/cached such that when the user
clicks on a hotel offer the server side will respond with a another dynamic content web page containing the detailed information about the hotel offer.
For the sake of maintining the simplicity of this app; Redis framework was not used and the stored/cached response will be just a regular stored JSON object. 
# Prerequisite

-Node.js
-Express.js
-ejs

Just hit npm install after cloning the project.


# Assumptions

-expedia API will retrieve correct/best match results.

# Issues:
No expedia api specific hotel request is available, which was approximalty solved by storing references in a Map to hotels from the last 
offers request.
