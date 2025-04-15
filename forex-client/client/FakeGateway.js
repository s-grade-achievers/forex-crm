import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from './apiConfig.js';


export default function PaymentProcessing() {
const navigate = useNavigate();
const { state } = useLocation();

const {
    fromCurrencyId,
    toCurrencyId,
    rate,
    amount,
    convertedAmount,
    time,
    accountId,
    username
} = state || {};

const handleProceed = async () => {
    try {
    const res = await axios.post(`${BASE_URL}/api/verifyPayment`, {
        fromCurrencyId,
        toCurrencyId,
        userID: accountId,
        amount
    });

    const { signedAck } = res.data;

    await axios.post(`${BASE_URL}/api/confirmTransaction`, {
        signedAck,
    });

    console.log('Transaction processed successfully');
    } catch (error) {
    console.error('Error during transaction processing:', error);
    }
};

useEffect(() => {
    const timer = setTimeout(() => {
    handleProceed();
    navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
}, [navigate]);


return (
    <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Arial, sans-serif'
    }}>
    <div className="spinner" />
    <h2 style={{ marginTop: '1rem' }}>💳 Processing your payment...</h2>

    <style>{`
        .spinner {
        border: 6px solid #f3f3f3;
        border-top: 6px solid #3498db;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        }

        @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
        }
    `}</style>
    </div>
);
}
