python3 -m http.server

expected to run on localhost:8000  
see checkout.html for more information

note: checkout api expects the following:

- tokenId - number representing your token id you are purchasing
- tokenAddress - token address (hexadecimal) representing the address (ethereum) that you're purchasing from
- mobileNumber - the mobile number; I need to be able to send an SMS using this number using Twilio
- smsCode - the sms code sent to the mobile phone for verification; we will validate this
- successUrl - where to redirect the user on successful purchase
- cancelUrl - where to redirect the user on cancel

the checkout api expects these values to be sent as BODY arguments (JSON) POST to:
URL/v0/payment/checkout
