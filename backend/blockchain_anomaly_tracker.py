import os
import requests
from dotenv import load_dotenv
import time
import json
import pandas as pd
from typing import Dict, List
import datetime
from web3 import Web3
from Crypto.Hash import keccak

load_dotenv()

api_key = os.getenv('ETHERSCAN_API_KEY')  
coin_key = os.getenv('GECKO_API')
infura_url = os.getenv('INFURA_URL')

if not api_key:
    raise ValueError("Please set the ETHERSCAN_API_KEY environment variable")

if not coin_key:
    raise ValueError("Please set the GECKO_API environment variable")

if not infura_url:
    raise ValueError("Please set the INFURA_URL environment variable")

print("All API keys loaded successfully")

class EtherscanAPI:
    def __init__(self, api_key: str, coin_key: str):
        self.api_key = api_key
        self.coin_key = coin_key
        self.base_url = "https://api.etherscan.io/v2/api"

    def get_transaction_details(self, tx_hash: str):
        """Fetch raw transaction details (from, to, value, gasPrice, hash, nonce, input)"""
        url = (
            f"{self.base_url}"
            f"?chainid=1"
            f"&module=proxy"
            f"&action=eth_getTransactionByHash"
            f"&txhash={tx_hash}"
            f"&apikey={self.api_key}"
        )
        response = requests.get(url).json()
        return response.get("result", {})

    def get_transaction_receipt(self, tx_hash: str):
        """Fetch transaction receipt (logs, status, gasUsed, contractAddress, blockNumber)"""
        url = (
            f"{self.base_url}"
            f"?chainid=1"
            f"&module=proxy"
            f"&action=eth_getTransactionReceipt"
            f"&txhash={tx_hash}"
            f"&apikey={self.api_key}"
        )
        response = requests.get(url).json()
        return response.get("result", {})

    def get_token_info(self, contract_address: str):
        """Fetch ERC20 token metadata using CoinGecko"""
        try:
            url = f"https://api.coingecko.com/api/v3/coins/ethereum/contract/{contract_address}"
            response = requests.get(url).json()

            if "error" in response:
                return {}

            return {
                "name": response.get("name"),
                "symbol": response.get("symbol"),
                "decimals": response.get("detail_platforms", {})
                               .get("ethereum", {})
                               .get("decimal_place", 18)
            }
        except Exception as e:
            print(f"Error fetching token info from CoinGecko: {e}")
            return {"name": "Unknown Token", "symbol": "UNKNOWN", "decimals": 18}

    def get_single_transaction_analysis(self, tx_hash: str):
        """Analyze a single transaction: ETH transfer, ERC20 transfer, approval, or contract interaction"""
        try:
            tx_details = self.get_transaction_details(tx_hash)
            tx_receipt = self.get_transaction_receipt(tx_hash)

            if not tx_details or not tx_receipt:
                return None

            # Get block timestamp
            block_number = tx_receipt.get("blockNumber", "0x0")
            block_url = (
                f"{self.base_url}"
                f"?chainid=1"
                f"&module=proxy"
                f"&action=eth_getBlockByNumber"
                f"&tag={block_number}"
                f"&boolean=true"
                f"&apikey={self.api_key}"
            )
            block_response = requests.get(block_url).json()
            block_data = block_response.get("result", {})
            timestamp = str(int(block_data["timestamp"], 16)) if block_data.get("timestamp") else "0"

            # Extract logs
            logs = tx_receipt.get("logs", [])

            # Topics
            transfer_topic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
            approval_topic = "0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925"

            # Default ETH value
            eth_value = int(tx_details.get("value", "0x0"), 16) / 1e18

            tx_data = {
                "hash": tx_hash,
                "from": tx_details.get("from", ""),
                "to": tx_details.get("to", ""),
                "blockNumber": block_number,
                "timeStamp": timestamp,
                "gasUsed": tx_receipt.get("gasUsed", "0"),
                "gasPrice": tx_details.get("gasPrice", "0"),
                "status": tx_receipt.get("status", "0x0"),
                "input": tx_details.get("input", "0x"),  # Add input data
                # Defaults to prevent KeyError
                "value": "0",
                "tokenName": None,
                "tokenSymbol": None,
                "tokenDecimal": None,
                "tokenAddress": None,
                "tx_type": "unknown"
            }

            # ERC20 Transfer
            for log in logs:
                topics = log.get("topics", [])
                if topics and topics[0] == transfer_topic and len(topics) >= 3:
                    from_address = "0x" + topics[1][-40:]
                    to_address = "0x" + topics[2][-40:]
                    token_contract = log.get("address", "")

                    token_info = self.get_token_info(token_contract)
                    data = log.get("data", "0x0")

                    try:
                        amount_wei = int(data, 16)
                        decimals = int(token_info.get("decimals", 18))
                        amount = amount_wei / (10**decimals)
                    except:
                        amount, decimals = 0, 18

                    tx_data.update({
                        "from": from_address,
                        "to": to_address,
                        "value": str(amount),
                        "tokenName": token_info.get("name"),
                        "tokenSymbol": token_info.get("symbol"),
                        "tokenDecimal": str(decimals),
                        "tokenAddress": token_contract,
                        "tx_type": "erc20_transfer"
                    })
                    return tx_data  # first match only

            # ERC20 Approval
            for log in logs:
                topics = log.get("topics", [])
                if topics and topics[0] == approval_topic and len(topics) >= 3:
                    owner = "0x" + topics[1][-40:]
                    spender = "0x" + topics[2][-40:]
                    token_contract = log.get("address", "")

                    token_info = self.get_token_info(token_contract)
                    data = log.get("data", "0x0")

                    try:
                        amount_wei = int(data, 16)
                        decimals = int(token_info.get("decimals", 18))
                        amount = amount_wei / (10**decimals)
                    except:
                        amount, decimals = 0, 18

                    tx_data.update({
                        "owner": owner,
                        "spender": spender,
                        "value": str(amount),
                        "tokenName": token_info.get("name"),
                        "tokenSymbol": token_info.get("symbol"),
                        "tokenDecimal": str(decimals),
                        "tokenAddress": token_contract,
                        "tx_type": "erc20_approval"
                    })
                    return tx_data

            # ETH Transfer
            if eth_value > 0: # Ensures ETH was transferred (not just a contract call)
                tx_data.update({
                    "value": str(eth_value),
                    "tokenName": "Ethereum",
                    "tokenSymbol": "ETH",
                    "tokenDecimal": "18",
                    "tokenAddress": "0x0000000000000000000000000000000000000000",
                    "tx_type": "eth_transfer"
                })
                return tx_data

            # Contract Interaction
            if tx_details.get("input") and tx_details["input"] != "0x":
                method_id = tx_details["input"][:10]
                tx_data.update({
                    "methodId": method_id,
                    "input": tx_details["input"],
                    "tx_type": "contract_interaction"
                })
                return tx_data

            # Default (failed/other)
            tx_data.update({"tx_type": "other"})
            return tx_data

        except Exception as e:
            print(f"Error analyzing transaction {tx_hash}: {e}")
            return None
        
class InputDecoder:
    def __init__(self, etherscan_api_key: str, infura_url: str):
        self.api_key = etherscan_api_key
        self.w3 = Web3(Web3.HTTPProvider(infura_url))
        if not self.w3.is_connected():
            raise ConnectionError("Could not connect to Infura")
        self.abi_cache = {}
        self.selector_cache = {}

    def get_abi(self, contract_address: str):
        contract_address = self.w3.to_checksum_address(contract_address)
        if contract_address in self.abi_cache:
            return self.abi_cache[contract_address]

        url = (
            f"https://api.etherscan.io/api"
            f"?module=contract&action=getabi"
            f"&address={contract_address}"
            f"&apikey={self.api_key}"
        )
        resp = requests.get(url).json()
        if resp.get("status") == "1":
            abi = json.loads(resp["result"])
            self.abi_cache[contract_address] = abi
            return abi
        return None

    def build_selector_map(self, abi):
        """Precompute selectors from ABI"""
        selector_map = {}
        for item in abi:
            if item.get("type") == "function":
                name = item["name"]
                types = ",".join([inp["type"] for inp in item["inputs"]])
                signature = f"{name}({types})"

                k = keccak.new(digest_bits=256)
                k.update(signature.encode("utf-8"))
                selector = "0x" + k.hexdigest()[:8]

                selector_map[selector] = {
                    "name": name,
                    "signature": signature,
                }
        return selector_map

    def get_method_from_4byte(self, method_id: str):
        """Fallback: Get method signature from 4byte.directory"""
        try:
            url = f"https://www.4byte.directory/api/v1/signatures/?hex_signature={method_id}"
            response = requests.get(url, timeout=5)
            data = response.json()
            if data.get("results"):
                # Get the most common signature (first result)
                signature = data["results"][0]["text_signature"]
                method_name = signature.split("(")[0]
                return method_name
        except Exception:
            pass
        return None

    def decode_function(self, contract_address: str, input_data: str):
        """Decode input data into method name + params"""
        if not input_data or input_data == "0x":
            return {"method": None, "params": {}}
        
        # First, try to get a basic method signature from the method ID
        method_id = input_data[:10]
        
        # Common method signatures for fallback
        common_signatures = {
            "0xa9059cbb": "transfer",
            "0x095ea7b3": "approve",
            "0x23b872dd": "transferFrom",
            "0x18160ddd": "totalSupply",
            "0x70a08231": "balanceOf",
            "0xdd62ed3e": "allowance",
            "0x2e1a7d4d": "withdraw",
            "0xd0e30db0": "deposit",
            "0x7ff36ab5": "swapExactETHForTokens",
            "0x38ed1739": "swapExactTokensForTokens",
            "0x18cbafe5": "swapExactTokensForETH",
        }
        
        # Try common signatures first
        if method_id in common_signatures:
            return {"method": common_signatures[method_id], "params": {}}

        abi = self.get_abi(contract_address)
        if not abi:
            # Try 4byte directory as fallback
            method_name = self.get_method_from_4byte(method_id)
            if method_name:
                return {"method": method_name, "params": {}}
            else:
                return {"method": method_id, "params": {}}

        # Precompute selectors once
        if contract_address not in self.selector_cache:
            self.selector_cache[contract_address] = self.build_selector_map(abi)

        selector_map = self.selector_cache[contract_address]

        # Fallback 1: Try lookup by selector
        if method_id in selector_map:
            method_info = selector_map[method_id]
            method_name = method_info["name"]
        else:
            method_name = None

        # Fallback 2: Try Web3 decoding
        try:
            contract = self.w3.eth.contract(
                address=self.w3.to_checksum_address(contract_address), abi=abi
            )
            func_obj, func_params = contract.decode_function_input(input_data)
            return {"method": func_obj.fn_name, "params": func_params}
        except Exception:
            return {"method": method_name, "params": {}}
class BlockchainAnomalyTracker:
    def __init__(self, api_key: str, infura_url: str, coin_key: str):
        # API handles transactions + token info
        self.api = EtherscanAPI(api_key, coin_key) 
        # Decoder handles method signatures
        self.decoder = InputDecoder(api_key, infura_url)
  
    # Preprocessing
    def preprocess_data(self, data: List[Dict], is_single_tx: bool = False) -> pd.DataFrame:
        if not data:
            return pd.DataFrame()

        df = pd.DataFrame(data)

        # Timestamp
        if "timeStamp" in df.columns:
            df["timeStamp"] = pd.to_datetime(
                df["timeStamp"].astype(int), unit="s", errors="coerce"
            )
        else:
            df["timeStamp"] = pd.NaT

        # Value (safe handling)
        if "value" not in df.columns:
            df["value"] = 0.0
        else:
            def safe_value(v):
                try:
                    return float(v)
                except:
                    return 0.0
            df["value"] = df["value"].apply(safe_value)

        # Gas fee (safe conversion)
        def safe_gas_conversion(row):
            try:
                gas_used = row.get("gasUsed", "0")
                gas_price = row.get("gasPrice", "0")

                gas_used = int(gas_used, 16) if isinstance(gas_used, str) and gas_used.startswith("0x") else int(gas_used)
                gas_price = int(gas_price, 16) if isinstance(gas_price, str) and gas_price.startswith("0x") else int(gas_price)

                return gas_used * gas_price / 1e18
            except:
                return 0
        df["gasFee_ETH"] = df.apply(safe_gas_conversion, axis=1)

        # Decode method names from input - FIX: Handle the dictionary return
        if "input" in df.columns and "to" in df.columns:
            def decode_method_safe(row):
                try:
                    if row["input"] and row["input"] != "0x" and row["to"]:
                        result = self.decoder.decode_function(row["to"], row["input"])
                        return result.get("method", "unknown")
                    return "none"
                except:
                    return "unknown"
            df["decoded_method"] = df.apply(decode_method_safe, axis=1)
        else:
            df["decoded_method"] = "none"

        # Date + hour fields
        df["date"] = df["timeStamp"].dt.date
        df["hour"] = df["timeStamp"].dt.floor("h")

        return df

    # Classifiers
    def classify_gas_fees(self, gas_fee: float) -> str:
        if gas_fee < 0.000005:
            return "extremely_low"
        elif gas_fee <= 0.859339:
            return "normal"
        else:
            return "high"

    def classify_transfer_amounts(self, amount: float) -> str:
        if amount < 1000:
            return "retail_sender"
        elif amount < 10000:
            return "small_active"
        elif amount < 100000:
            return "mid_tier"
        elif amount < 1000000:
            return "high_value"
        else:
            return "institutional"

    def classify_transaction_frequency(self, tx_count: int) -> str:
        if tx_count <= 5:
            return "dormant_trader"
        elif tx_count <= 20:
            return "active_trader"
        elif tx_count <= 100:
            return "high_frequency_bot"
        else:
            return "extreme_anomaly"

    def classify_recipient_volume(self, hourly_amount: float) -> str:
        if hourly_amount < 1000:
            return "retail_recipient"
        elif hourly_amount < 10000:
            return "active_recipient"
        elif hourly_amount < 100000:
            return "dolphin"
        elif hourly_amount < 1000000:
            return "shark"
        else:
            return "whale"

    # Anomaly Detector
    def detect_gas_anomalies(self, df: pd.DataFrame) -> Dict:
        df["gas_category"] = df["gasFee_ETH"].apply(self.classify_gas_fees)
        return {
            "summary": df["gas_category"].value_counts().to_dict(),
            "extremely_low_transactions": df[df["gas_category"] == "extremely_low"].shape[0],
            "high_gas_transactions": df[df["gas_category"] == "high"].shape[0],
            "gas_stats": df["gasFee_ETH"].agg(["max", "min", "mean"]).to_dict(),
        }

    def detect_large_transfers(self, df: pd.DataFrame) -> Dict:
        df["transfer_category"] = df["value"].apply(self.classify_transfer_amounts)
        daily_stats = df.groupby("date")["value"].agg(
            largest_transfer="max",
            smallest_transfer="min",
            average_transfer="mean",
        ).reset_index()
        return {
            "transfer_categories": df["transfer_category"].value_counts().to_dict(),
            "daily_stats": daily_stats.to_dict("records"),
            "institutional_transfers": df[df["transfer_category"] == "institutional"].shape[0],
            "high_value_transfers": df[df["transfer_category"] == "high_value"].shape[0],
        }

    def detect_sender_anomalies(self, df: pd.DataFrame) -> Dict:
        sender_counts = df.groupby(["from", "hour"])["hash"].count().rename("tx_count").reset_index()
        sender_counts["frequency_category"] = sender_counts["tx_count"].apply(self.classify_transaction_frequency)

        def detect_sender_anomalies_group(group):
            mean = group["tx_count"].mean()
            std = group["tx_count"].std()
            if std == 0:
                return pd.DataFrame()
            return group[group["tx_count"] > mean + 2 * std]

        sender_anomalies = sender_counts.groupby("from", group_keys=False).apply(detect_sender_anomalies_group)
        return {
            "frequency_categories": sender_counts["frequency_category"].value_counts().to_dict(),
            "anomalous_senders": len(sender_anomalies["from"].unique()) if not sender_anomalies.empty else 0,
            "high_frequency_actors": sender_counts[
                sender_counts["frequency_category"].isin(["high_frequency_bot", "extreme_anomaly"])
            ].shape[0],
            "statistical_anomalies": sender_anomalies.to_dict("records") if not sender_anomalies.empty else [],
        }

    def detect_recipient_anomalies(self, df: pd.DataFrame) -> Dict:
        recipient_hourly = df.groupby(["to", df["timeStamp"].dt.floor("h")])["value"].sum().reset_index()
        recipient_hourly.columns = ["to", "hour", "hourly_amount"]
        recipient_hourly["volume_category"] = recipient_hourly["hourly_amount"].apply(self.classify_recipient_volume)

        def detect_recipient_anomalies_group(group):
            median = group["hourly_amount"].median()
            std = group["hourly_amount"].std()
            if std == 0:
                return pd.DataFrame()
            return group[group["hourly_amount"] > median + 2 * std]

        recipient_anomalies = recipient_hourly.groupby("to", group_keys=False).apply(detect_recipient_anomalies_group)
        return {
            "volume_categories": recipient_hourly["volume_category"].value_counts().to_dict(),
            "whale_recipients": recipient_hourly[recipient_hourly["volume_category"] == "whale"].shape[0],
            "shark_recipients": recipient_hourly[recipient_hourly["volume_category"] == "shark"].shape[0],
            "statistical_anomalies": recipient_anomalies.to_dict("records") if not recipient_anomalies.empty else [],
        }

    def detect_approval_anomalies(self, df: pd.DataFrame) -> Dict:
        approvals = df[df["decoded_method"].str.contains("approve", case=False, na=False)]
        grouped = approvals.groupby("from").size()
        suspicious = grouped[grouped > 5]
        return {
            "total_approvals": len(approvals),
            "suspicious_approvers": suspicious.to_dict(),
        }

    def detect_swap_anomalies(self, df: pd.DataFrame) -> Dict:
        swaps = df[df["decoded_method"].str.contains("swap", case=False, na=False)]
        grouped = swaps.groupby("from").size()
        whales = grouped[grouped > 10]
        return {
            "total_swaps": len(swaps),
            "heavy_swap_traders": whales.to_dict(),
        }

    def detect_flashloan_anomalies(self, df: pd.DataFrame) -> Dict:
        flashloans = df[df["decoded_method"].str.contains("flashloan|executeOperation", case=False, na=False)]
        return {
            "total_flashloans": len(flashloans),
            "flashloan_txs": flashloans[["hash", "from", "to"]].to_dict("records"),
        }
    
    def detect_tx_type(self, tx_data: Dict, decoded_method: str) -> str:
        """Detect transaction type based on value and decoded method."""
        if tx_data.get("input") == "0x" and float(tx_data.get("value", 0)) > 0:
            return "eth_transfer"
        if decoded_method:
            method = decoded_method.lower()
            if "transfer" in method:
                return "erc20_transfer"
            elif "approve" in method:
                return "erc20_approval"
            elif "swap" in method:
                return "swap"
            elif "flashloan" in method or "executeoperation" in method:
                return "flashloan"
        return "contract_interaction"
    
    def analyze_single_transaction(self, tx_hash: str) -> Dict:
        """Unified, simplified anomaly analysis for a single transaction hash."""
        try:
            # Step 1: Get raw tx analysis
            tx_data = self.api.get_single_transaction_analysis(tx_hash)
            if not tx_data:
                return {"error": f"No transaction found for hash {tx_hash}"}

            # Step 2: Decode method - FIX: Extract the method name from the dictionary
            decoded_method_info = None
            decoded_method = None
            if tx_data.get("input") and tx_data.get("to"):
                decoded_method_info = self.decoder.decode_function(
                    tx_data["to"], 
                    tx_data["input"]
                )
                decoded_method = decoded_method_info.get("method") if decoded_method_info else None
                tx_data["decoded_method"] = decoded_method

            # Step 3: Preprocess into DataFrame
            df = self.preprocess_data([tx_data], is_single_tx=True)

            # Step 4: Run detectors (extract risk flags instead of raw dumps)
            gas_summary = self.detect_gas_anomalies(df)
            gas_usage = (
                list(gas_summary["summary"].keys())[0]
                if gas_summary["summary"]
                else "unknown"
            )

            transfer_summary = self.detect_large_transfers(df)
            transfer_category = (
                list(transfer_summary["transfer_categories"].keys())[0]
                if transfer_summary["transfer_categories"]
                else "unknown"
            )

            approval_summary = self.detect_approval_anomalies(df)
            swap_summary = self.detect_swap_anomalies(df)
            flashloan_summary = self.detect_flashloan_anomalies(df)

            # Step 5: Detect tx type
            tx_type = self.detect_tx_type(tx_data, decoded_method)

            # Step 6: Build structured response
            report = {
                "analysis_type": "transaction_analysis",
                "tx_hash": tx_hash,
                "transaction_details": {
                    "from": tx_data.get("from"),
                    "to": tx_data.get("to"),
                    "token": {
                        "name": tx_data.get("tokenName", "ETH" if tx_type == "eth_transfer" else None),
                        "symbol": tx_data.get("tokenSymbol", "ETH" if tx_type == "eth_transfer" else None),
                        "decimals": tx_data.get("tokenDecimal", 18 if tx_type == "eth_transfer" else None),
                    },
                    "value": f"{tx_data.get('value')} {tx_data.get('tokenSymbol', 'ETH')}",
                    "method": decoded_method,
                    "tx_type": tx_type,
                    "gas_fee_eth": f"{df.iloc[0]['gasFee_ETH']:.8f} ETH"
                },
                "risk_flags": {
                    "gas_usage": gas_usage,
                    "transfer_category": transfer_category,
                    "approval_anomaly": approval_summary["total_approvals"] > 0,
                    "swap_activity": swap_summary["total_swaps"] > 0,
                    "flashloan_activity": flashloan_summary["total_flashloans"] > 0,
                },
                "verdict": self.build_verdict(
                    tx_type,
                    tx_data.get("value"),
                    tx_data.get("tokenSymbol", "ETH"),
                    gas_usage,
                    transfer_category,
                    approval_summary,
                    swap_summary,
                    flashloan_summary,
                    decoded_method
                )
            }

            # Fix datetime serialization
            def convert(obj):
                if isinstance(obj, (datetime.date, datetime.datetime)):
                    return obj.isoformat()
                raise TypeError(f"Type {type(obj)} not serializable")

            return json.loads(json.dumps(report, default=convert))

        except Exception as e:
            return {"error": f"Single tx analysis failed: {str(e)}"}
        
    def build_verdict(
        self,
        tx_type,
        value,
        symbol,
        gas_usage,
        transfer_category,
        approval_summary,
        swap_summary,
        flashloan_summary,
        decoded_method=None
    ) -> str:
        """Generate a human-readable verdict string."""
        if tx_type == "erc20_transfer":
            return f"This is a standard ERC20 transfer of {value} {symbol} with {gas_usage} gas usage. No anomalies detected."
        if tx_type == "eth_transfer":
            return f"This is a standard ETH transfer of {value} ETH with {gas_usage} gas usage."
        if tx_type == "erc20_approval":
            return "This is an ERC20 approval transaction."
        if tx_type == "swap":
            return "This is a swap transaction."
        if tx_type == "flashloan":
            return "This is a flashloan transaction."
        if decoded_method:
            return f"This is a contract interaction calling method '{decoded_method}' with {gas_usage} gas usage."
        return "This is a generic contract interaction."