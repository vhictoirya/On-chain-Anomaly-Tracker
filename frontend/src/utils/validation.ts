export const isValidEthereumAddress = (address: string): boolean => {
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  return addressRegex.test(address);
};

export const isValidTransactionHash = (hash: string): boolean => {
  const hashRegex = /^0x[a-fA-F0-9]{64}$/;
  return hashRegex.test(hash);
};

export const detectInputType = (input: string): 'address' | 'transaction' | 'invalid' => {
  const trimmed = input.trim();
  
  if (isValidEthereumAddress(trimmed)) {
    return 'address';
  }
  
  if (isValidTransactionHash(trimmed)) {
    return 'transaction';
  }
  
  return 'invalid';
};

export const formatAddress = (address: string, chars: number = 6): string => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};