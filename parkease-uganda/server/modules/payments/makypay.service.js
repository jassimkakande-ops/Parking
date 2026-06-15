const logger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');

const MAKYPAY_API_URL = process.env.MAKYPAY_BASE_URL || 'https://wire-api.makylegacy.com/api/v1';
const MAKYPAY_CREDENTIALS = process.env.MAKYPAY_BASE64_CREDENTIALS || process.env.MAKYPAY_CREDENTIALS || 'mock_base64_credentials';

/**
 * Initiates a collection (payment) via MakyPay API.
 * Supports both Mobile Money and Card depending on the method.
 */
exports.initiateCollection = async ({ amount, phoneNumber, method, reference, description }) => {
  try {
    const params = new URLSearchParams();
    params.append('amount', amount);
    params.append('country', 'UG');
    params.append('reference', reference);
    
    if (description) {
      params.append('description', description);
    }
    
    if (method === 'card') {
      params.append('method', 'card');
    } else {
      // Mobile money
      params.append('phone_number', phoneNumber);
    }

    // Call the real API if credentials are provided in env, else mock it
    if (process.env.NODE_ENV === 'test' || MAKYPAY_CREDENTIALS === 'mock_base64_credentials') {
      logger.info('Mocking MakyPay API call', { reference, amount, method });
      return {
        status: 'success',
        message: 'Mock collection initiated.',
        data: {
          transaction: {
            uuid: 'mock-uuid-' + Date.now(),
            reference: reference,
            status: 'processing'
          },
          redirect_url: method === 'card' ? `https://mock.makylegacy.com/pay?ref=${reference}` : undefined
        }
      };
    }

    const response = await fetch(`${MAKYPAY_API_URL}/collections/collect-money`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${MAKYPAY_CREDENTIALS}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
      logger.error('MakyPay collection failed details', { status: response.status, data });
      const errorMessage = data.detail?.message || data.message || 'Payment initiation failed';
      throw new AppError(errorMessage, response.status === 429 ? 429 : 400);
    }

    return data;
  } catch (error) {
    logger.error('MakyPay initiateCollection error', { error: error.message });
    throw error;
  }
};

/**
 * Checks transaction status
 */
exports.checkTransactionStatus = async (transactionId) => {
  try {
    if (process.env.NODE_ENV === 'test' || MAKYPAY_CREDENTIALS === 'mock_base64_credentials') {
      return {
        status: 'success',
        data: {
          transaction: {
            status: 'completed'
          }
        }
      };
    }

    const response = await fetch(`${MAKYPAY_API_URL}/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${MAKYPAY_CREDENTIALS}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('MakyPay checkTransactionStatus error', { error: error.message });
    throw error;
  }
};
