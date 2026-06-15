/**
 * Normalizes a Ugandan phone number to the 256XXXXXXXXX format required by MakyPay.
 * 
 * @param {string} phone - The raw phone number
 * @returns {string} - The normalized phone number
 */
exports.normalizePhoneNumber = (phone) => {
  if (!phone) return phone;
  
  // Remove all non-numeric characters
  let cleanPhone = phone.replace(/\D/g, '');
  
  // If it starts with 0 (e.g., 077...), replace the 0 with 256
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    return '256' + cleanPhone.substring(1);
  }
  
  // If it's already 12 digits and starts with 256
  if (cleanPhone.length === 12 && cleanPhone.startsWith('256')) {
    return cleanPhone;
  }
  
  // If it's 9 digits (e.g., 77...), prepend 256
  if (cleanPhone.length === 9 && (cleanPhone.startsWith('7') || cleanPhone.startsWith('3'))) {
    return '256' + cleanPhone;
  }
  
  // Return original if it doesn't match expected patterns
  return cleanPhone;
};
