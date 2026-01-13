# server/utils/mpesa_client.py
import requests
import base64
import datetime
from server.config import MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_ENV

class MpesaClient:
    """
    Handles Safaricom M-Pesa API integration (STK Push and Payment Queries)
    """

    def __init__(self):
        self.consumer_key = MPESA_CONSUMER_KEY
        self.consumer_secret = MPESA_CONSUMER_SECRET
        self.shortcode = MPESA_SHORTCODE
        self.passkey = MPESA_PASSKEY
        self.env = MPESA_ENV  # 'sandbox' or 'production'
        self.base_url = "https://sandbox.safaricom.co.ke" if self.env == 'sandbox' else "https://api.safaricom.co.ke"
        self.token = None

    def get_access_token(self):
        """
        Get OAuth token from Safaricom
        """
        auth = (self.consumer_key, self.consumer_secret)
        url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
        response = requests.get(url, auth=auth)

        if response.status_code == 200:
            self.token = response.json()['access_token']
            return self.token
        else:
            raise Exception(f"Mpesa OAuth failed: {response.text}")

    def stk_push(self, amount, phone_number, account_reference="AnimalPayment", transaction_desc="Payment"):
        """
        Initiates an STK Push (Lipa Na Mpesa Online)
        phone_number: 2547XXXXXXXX
        amount: float/int
        """
        if not self.token:
            self.get_access_token()

        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": amount,
            "PartyA": phone_number,
            "PartyB": self.shortcode,
            "PhoneNumber": phone_number,
            "CallBackURL": "https://yourdomain.com/payment/callback",  # Update with your callback endpoint
            "AccountReference": account_reference,
            "TransactionDesc": transaction_desc
        }

        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"STK Push failed: {response.text}")

    def check_transaction_status(self, checkout_request_id):
        """
        Query transaction status using CheckoutRequestID
        """
        if not self.token:
            self.get_access_token()

        url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        headers = {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}

        timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
        password_str = f"{self.shortcode}{self.passkey}{timestamp}"
        password = base64.b64encode(password_str.encode()).decode()

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp,
            "CheckoutRequestID": checkout_request_id
        }

        response = requests.post(url, json=payload, headers=headers)
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Transaction query failed: {response.text}")
