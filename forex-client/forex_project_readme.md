# Client Project Overview

This project is a forex exchange system where users can buy and manage currencies, view their wallet balances, and initiate payments. Below is a summary of the features implemented, data fetching endpoints, and the flow of the application.

## Features

### 1. JWT Authentication
- **Authorization**: Users are authenticated via JWT tokens to securely access endpoints.
- **Token-based Security**: Once logged in, users receive a token that is required for subsequent API requests, ensuring secure access.

### 2. Currency Exchange
- **Fetch Currency Pairs**: Currency pairs are fetched from the backend and stored in a structured format for easy usage. The pairs include fromCurrency, toCurrency, and the associated exchange rate.
- **Forex Payment**: Users can initiate currency transactions. The application computes the converted amount based on the exchange rate and generates a bill for approval.

### 3. Database Update with Rollback on Failure
- **Transactional Integrity**: If a failure occurs during a currency transaction (e.g., in the process of updating the wallet or payment verification), the database is rolled back to ensure data consistency.
- **Wallet Update**: Whenever a user buys new currency, the wallet is updated to reflect the new balance. If the wallet does not exist for a particular currency, it is created.
- **Rollback on Error**: Any error encountered during the transaction triggers a rollback, preventing partial updates.

### 4. Wallet Balance Management
- **View Wallet Balance**: Users can view their wallet balance by querying the backend for wallet details based on their user ID.
- **Wallet Details**: The wallet details include the balance, wallet ID, currency ID, and the date the wallet was created and last updated.

### 5. Payment Gateway Integration
- **Payment Verification**: Payments are verified with the master backend after generating the transaction token. The transaction is considered successful only after validation.
- **Transaction Acknowledgment**: Once a transaction is confirmed, the system acknowledges the completion and updates the relevant data in the database.

## Data Fetching Endpoints

### `GET /api/getPairs`
- **Description**: Fetches available currency pairs (from and to currency) along with exchange rates from the backend.

**Response Structure**:
```json
{
  "for": { "fromCurrencyId": "fromCurrency", ... },
  "to": { "toCurrencyId": "toCurrency", ... },
  "rates": { "fromCurrencyId_toCurrencyId": exchangeRate, ... }
}
```

---

### `POST /api/forexPayment`
- **Description**: Sends a forex payment request, generates a bill with the amount, rate, and converted amount.

**Request Body**:
```json
{
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "amount": 100,
  "rate": 1.25,
  "accountId": 123,
  "username": "user"
}
```

**Response**: A message indicating that the transaction is sent for approval along with the bill details.

---

### `POST /api/verifyPayment`
- **Description**: Verifies the forex payment by creating a signed JWT token and sending it to the master backend for validation. The wallet is updated accordingly.

**Request Body**:
```json
{
  "userID": 123,
  "fromCurrencyId": 1,
  "toCurrencyId": 2,
  "amount": 100
}
```

**Response**: A message confirming the completion of the transaction and a signed acknowledgment from the master backend.

---

### `POST /api/confirmTransaction`
- **Description**: Confirms a transaction in the system. This endpoint is triggered when the transaction is finalized.

**Request Body**: Transaction details (e.g., user ID, currency IDs, amount).

**Response**: A status message confirming the transaction.

---

### `GET /api/wallet/:userId`
- **Description**: Fetches the wallet details for a specific user. The wallet includes the balance and currency details.

**Response Structure**:
```json
[
  {
    "id": 1,
    "user_id": 123,
    "currency_id": 1,
    "balance": 500,
    "created_at": "2025-01-01T00:00:00",
    "updated_at": "2025-01-01T00:00:00"
  }
]
```

## Error Handling

- **Database Operations**: If any errors occur during database operations (e.g., while updating or inserting wallet data), the transaction is rolled back to prevent data corruption. Even in the case of JWT token failure.
- **API Errors**: All endpoints are wrapped in try-catch blocks, ensuring that any issues (e.g., network failure or invalid data) result in a clear error message with a status code.

## Conclusion

This client-side system allows users to buy and manage currencies while ensuring data consistency with rollback mechanisms during failures. It integrates with a backend to handle authentication, transaction verification, and wallet updates. The use of JWT ensures secure communication between the client and server, making the system both secure and reliable.
