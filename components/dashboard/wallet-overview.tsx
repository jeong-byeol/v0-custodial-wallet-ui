"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Copy, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useWeb3Auth, useWeb3AuthConnect } from "@web3auth/modal/react"
import { useAccount, useBalance, useSendTransaction } from "wagmi";
import { useState } from "react";
import { ethers, parseEther } from "ethers";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const guardAddress = process.env.NEXT_PUBLIC_GUARD_ADDRESS ?? "";
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";

interface WalletOverviewProps {
  safeAddress: string;
  onSafeAddressChange: (address: string) => void;
}

export function WalletOverview({ safeAddress, onSafeAddressChange }: WalletOverviewProps) {
  const { web3Auth } = useWeb3Auth();
  const { isConnected } = useWeb3AuthConnect();
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [isCreatingSafe, setIsCreatingSafe] = useState<boolean>(false);
  const [isCreatingGuard, setIsCreatingGuard] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [isPendingLoading, setIsPendingLoading] = useState<boolean>(false);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);

  // 한글 주석: Safe 주소 변경 시 상위 컴포넌트에 알림
  const setSafeAddress = (address: string) => {
    onSafeAddressChange(address);
  };

  // wagmi 훅으로 Safe 주소의 ETH 잔액을 주기 갱신하여 조회
  const {
    data: safeBalance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useBalance({
    address: (safeAddress ? (safeAddress as `0x${string}`) : undefined),
    chainId: 11155111, // Sepolia
    query: {
      enabled: Boolean(safeAddress),
      refetchInterval: 10000, // 10초 폴링
      retry: 1,
    },
  });

  // 한글 주석: 공통 인증 컨텍스트 조회 (ID 토큰 + 사용자 이메일)
  const fetchAuthContext = async () => {
    if (!web3Auth) {
      throw new Error("Web3Auth가 준비되지 않았습니다.");
    }

    const [identityTokenInfo, userInfo] = await Promise.all([
      web3Auth.getIdentityToken(),
      web3Auth.getUserInfo(),
    ]);

    const idToken = identityTokenInfo?.idToken ?? "";
    const userEmail = userInfo?.email ?? "";

    if (!idToken) {
      throw new Error("ID 토큰을 가져오지 못했습니다.");
    }
    if (!userEmail) {
      throw new Error("사용자 이메일을 가져오지 못했습니다.");
    }

    return { idToken, userEmail };
  };

  // 한글 주석: 서버에서 Safe 주소 조회
  const fetchSafeAddressFromServer = async (idToken: string, userEmail: string) => {
    const requestUrl = new URL(`${apiBaseUrl}/api/v1/user/get-user-info`);
    requestUrl.searchParams.set("email", userEmail);

    const res = await fetch(requestUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${idToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`사용자 정보 조회 실패: ${res.status} ${res.statusText}`);
    }

    const userData = await res.json();
    return userData?.safe_address ?? "";
  };

  // 한글 주석: 트랜잭션 영수증 대기 헬퍼 함수
  const waitForTransactionReceipt = async (txHash: `0x${string}`) => {
    return new Promise((resolve, reject) => {
      const checkReceipt = async () => {
        try {
          const response = await fetch(rpcUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jsonrpc: "2.0",
              method: "eth_getTransactionReceipt",
              params: [txHash],
              id: 1,
            }),
          });
          
          const data = await response.json();
          
          if (data.result) {
            resolve({
              status: data.result.status === "0x1" ? "success" : "reverted",
              blockNumber: data.result.blockNumber,
              transactionHash: data.result.transactionHash,
            });
          } else {
            setTimeout(checkReceipt, 3000);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      checkReceipt();
    });
  };

  // 한글 주석: Safe 주소 조회
  const handleViewSafe = async () => {
    try {
      const { idToken, userEmail } = await fetchAuthContext();
      const userSafeAddress = await fetchSafeAddressFromServer(idToken, userEmail);
      
      if (!userSafeAddress) {
        console.log("등록된 Safe 주소가 없습니다.");
        return null;
      }

      setSafeAddress(userSafeAddress);
      console.log("Safe 주소 설정됨:", userSafeAddress);
      return userSafeAddress;
    } catch (error) {
      console.error("Safe 주소 조회 실패:", error);
      return null;
    }
  };

  // 한글 주석: Safe 생성
  const handleCreateSafe = async () => {
    const existingSafe = await handleViewSafe();
    if (existingSafe) {
      alert("Safe 주소가 이미 존재합니다.");
      return;
    }

    try {
      setIsCreatingSafe(true);

      if (!web3Auth) {
        console.error("Web3Auth가 준비되지 않았습니다.");
        return;
      }

      const { idToken, userEmail } = await fetchAuthContext();

      const response = await fetch(`${apiBaseUrl}/api/v1/safe/create-safe`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, userAddress: address }),
      });

      const newSafeAddress = await response.text();
      setSafeAddress(newSafeAddress);
      alert("Safe 생성이 완료되었습니다.");
    } catch (error) {
      console.error("Safe 생성 실패:", error);
      alert("Safe 생성 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingSafe(false);
    }
  };

  // 한글 주석: Guard 적용
  const handleCreateGuard = async () => {
    try {
      setIsCreatingGuard(true);

      if (!guardAddress) {
        alert("가드 주소가 설정되지 않았습니다.");
        return;
      }

      const { idToken, userEmail } = await fetchAuthContext();

      let targetSafeAddress = safeAddress;
      if (!targetSafeAddress) {
        targetSafeAddress = await fetchSafeAddressFromServer(idToken, userEmail);
        if (targetSafeAddress) setSafeAddress(targetSafeAddress);
      }
      
      if (!targetSafeAddress) {
        alert("Safe 주소가 없습니다. 먼저 Safe를 생성해주세요.");
        return;
      }

      // 1) Guard 트랜잭션 제안
      const proposeResponse = await fetch(`${apiBaseUrl}/api/v1/tx/set-guard/propose`, {
      method: "POST",
      headers: {
          "Authorization": `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
        body: JSON.stringify({
          email: userEmail,
          safeAddress: targetSafeAddress,
          guardAddress,
        }),
      });

      if (!proposeResponse.ok) {
        const errorText = await proposeResponse.text();
        console.error("가드 설정 제안 실패:", errorText);
        alert("가드 설정 제안에 실패했습니다.");
        return;
      }

      const txhashResponse = await proposeResponse.text();
      let txhash: string | null = null;
      
      try {
        const parsedResponse = JSON.parse(txhashResponse);
        txhash = parsedResponse.safeTxHash || parsedResponse.txHash || parsedResponse.hash || null;
      } catch {
        txhash = txhashResponse;
      }

      if (!txhash || !txhash.startsWith("0x")) {
        console.error("유효하지 않은 txhash:", txhash);
        alert("트랜잭션 해시를 확인할 수 없습니다.");
        return;
      }

      // 2) 사용자 서명 생성 (eth_sign)
      if (!web3Auth?.provider) {
        console.error("Web3Auth provider가 없습니다.");
        return;
      }

      const ethersProvider = new ethers.BrowserProvider(web3Auth.provider);
      const signer = await ethersProvider.getSigner();
      const signerAddress = await signer.getAddress();

      const signature = await signer.provider?.send("eth_sign", [signerAddress, txhash]);
      
      if (!signature) {
        console.error("서명 생성 실패");
        alert("서명 생성에 실패했습니다.");
        return;
      }

      // 3) Guard 확정 요청
      const confirmResponse = await fetch(`${apiBaseUrl}/api/v1/tx/confirm-guard`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          safeTxHash: txhash,
          userSignature: signature,
        }),
      });

      if (confirmResponse.ok) {
        const confirmData = await confirmResponse.json().catch(() => null);
        if (confirmData?.readyToExecute) {
          if (confirmData?.txServiceUrl) {
            window.open(confirmData.txServiceUrl, "_blank");
          }
          alert("가드 연결 준비 완료! Safe Web App에서 실행해주세요.");
        } else {
          alert("가드 연결이 완료되었습니다.");
        }
      } else {
        const errorResponse = await confirmResponse.json().catch(() => null);
        const errorMessage = errorResponse?.message || `HTTP ${confirmResponse.status}`;
        console.error("가드 설정 실패:", errorMessage);
        alert(`가드 설정에 실패했습니다: ${errorMessage}`);
      }
    } catch (error) {
      console.error("가드 설정 오류:", error);
      alert("가드 설정 중 오류가 발생했습니다.");
    } finally {
      setIsCreatingGuard(false);
    }
  };

  const handleCopyAddress = () => {
    if (!isConnected || !safeAddress) return;
    navigator.clipboard.writeText(safeAddress);
    alert("Safe 주소가 복사되었습니다.");
  };

  // 한글 주석: 입금 기능
  const handleDeposit = async () => {
    try {
      if (!isConnected || !address || !safeAddress) {
        alert("로그인 후 Safe 주소를 먼저 확인해주세요.");
        return;
      }

      if (!depositAmount || parseFloat(depositAmount) <= 0) {
        alert("입금할 ETH 금액을 입력해주세요.");
        return;
      }

      setIsDepositing(true);

      // 1) ETH 전송
      const txHash = await sendTransactionAsync({
        to: safeAddress as `0x${string}`,
        value: parseEther(depositAmount),
        chainId: 11155111,
      });

      console.log("입금 트랜잭션 해시:", txHash);
      alert("트랜잭션이 전송되었습니다. 블록 확인을 기다리는 중...");

      // 2) 블록 포함 대기
      const receipt = await waitForTransactionReceipt(txHash) as any;
      
      if (!receipt || receipt.status !== "success") {
        throw new Error("트랜잭션이 실패했습니다.");
      }

      // 3) DB 저장 (Safe API 동기화 방식) --safe api 동기화 방식 변경으로 인한 삭제 예정(벡에드에서도 삭제 필요)
      // const { idToken, userEmail } = await fetchAuthContext();

      // const response = await fetch(`${apiBaseUrl}/api/v1/tx/deposit`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${idToken}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     email: userEmail,
      //     safeAddress: safeAddress,
      //     txHash: txHash,
      //   }),
      // });

      // if (response.ok) {
      //   const savedTx = await response.json();
      //   console.log("입금 완료:", savedTx);
      //   alert(`${depositAmount} ETH 입금이 완료되었습니다!`);
      //   setDepositAmount("");
      // } else {
      //   alert("입금 완료되었습니다.");
      // }

      // 한글 주석: Safe API 동기화 방식으로 변경되어 수동 저장 불필요
      alert(`${depositAmount} ETH 입금이 완료되었습니다!`);
      setDepositAmount("");
    } catch (error) {
      console.error("입금 실패:", error);
      alert("입금 중 오류가 발생했습니다.");
    } finally {
      setIsDepositing(false);
    }
  };

  // 한글 주석: 출금 기능
  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);

      if (!isConnected || !safeAddress) {
        alert("로그인 후 Safe 주소를 먼저 확인해주세요.");
        return;
      }

      if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
        alert("출금할 ETH 금액을 입력해주세요.");
        return;
      }

      const { idToken, userEmail } = await fetchAuthContext();

      // 1) 출금 트랜잭션 제안
      const res = await fetch(`${apiBaseUrl}/api/v1/tx/withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail,
          amountWei: parseEther(withdrawAmount).toString(),
        }),
      });

      const withdrawResponseText = await res.text();
      let txhash: string | null = null;
      
      try {
        const parsedResponse = JSON.parse(withdrawResponseText);
        txhash = parsedResponse.safeHash || parsedResponse.safeTxHash || parsedResponse.txHash || parsedResponse.hash || null;
      } catch {
        txhash = withdrawResponseText;
      }

      if (!txhash || !txhash.startsWith("0x")) {
        console.error("유효한 safeTxHash를 찾을 수 없습니다:", txhash);
        alert("출금 트랜잭션 해시를 확인할 수 없습니다.");
        return;
      }

      // 2) 사용자 서명 (eth_sign)
      if (!web3Auth?.provider) {
        console.error("Web3Auth provider가 없습니다.");
        return;
      }

      const ethersProvider = new ethers.BrowserProvider(web3Auth.provider as any);
      const walletSigner = await ethersProvider.getSigner();
      const signerAddress = await walletSigner.getAddress();

      const signature = await walletSigner.provider?.send("eth_sign", [signerAddress, txhash]);

      if (!signature) {
        console.error("서명 생성 실패");
        alert("서명 생성에 실패했습니다.");
        return;
      }

      // 3) 출금 확정
      const response2 = await fetch(`${apiBaseUrl}/api/v1/tx/confirm-withdraw`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, safeTxHash: txhash, userSignature: signature }),
      });

      if (response2.ok) {
        const confirmData = await response2.json().catch(() => null);
        if (confirmData?.readyToExecute) {
          if (confirmData?.txServiceUrl) {
            window.open(confirmData.txServiceUrl, "_blank");
          }
          alert("출금 준비 완료! Safe Web App에서 실행해주세요.");
        }
      }

      // 4) DB 저장 (Safe API 동기화 방식) --safe api 동기화 방식 변경으로 인한 삭제 예정(벡에드에서도 삭제 필요)
      // const response3 = await fetch(`${apiBaseUrl}/api/v1/tx/record-withdraw-tx`, {
      //   method: "POST",
      //   headers: {
      //     "Authorization": `Bearer ${idToken}`,
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     email: userEmail,
      //     safeAddress: safeAddress,
      //     safeTxHash: txhash,
      //   }),
      // });

      // if (response3.ok) {
      //   const savedTx = await response3.json();
      //   console.log("출금 완료:", savedTx);
      //   alert(`${withdrawAmount} ETH 출금 요청이 완료되었습니다!`);
      //   setWithdrawAmount("");
      // } else {
      //   alert("출금 완료되었습니다.");
      // }

      // 한글 주석: Safe API 동기화 방식으로 변경되어 수동 저장 불필요
      alert(`${withdrawAmount} ETH 출금 요청이 완료되었습니다!`);
      setWithdrawAmount("");
    } catch (error) {
      console.error("출금 실패:", error);
      alert("출금 중 오류가 발생했습니다.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  

  // 한글 주석: 대기 중 트랜잭션 조회
  const handleFetchPendingTransactions = async () => {
    try {
      setIsPendingLoading(true);
      const { idToken, userEmail } = await fetchAuthContext();

      const res = await fetch(`${apiBaseUrl}/api/v1/tx/pending-transactions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      if (!res.ok) {
        alert("대기 중인 트랜잭션을 조회하지 못했습니다.");
        setPendingTransactions([]);
        return;
      }

      const data = await res.json();
      const transactions = Array.isArray(data?.pendingTransactions) ? data.pendingTransactions : [];
      setPendingTransactions(transactions);

      if (!safeAddress && data?.safeAddress) {
        setSafeAddress(data.safeAddress);
      }

      if (transactions.length === 0) {
        alert("대기 중인 트랜잭션이 없습니다.");
      }
    } catch (error) {
      console.error("대기 TX 조회 오류:", error);
      setPendingTransactions([]);
    } finally {
      setIsPendingLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">지갑 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {isConnected && (
              <div className="space-y-1 flex-1">
              <p className="text-sm text-muted-foreground">Safe Address</p>
              <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">{safeAddress || "-"}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress} disabled={!safeAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            )}
            
            <div className="flex gap-2 ml-auto flex-wrap">
              <Button
                onClick={handleViewSafe}
                variant="outline"
                size="sm"
                className="w-28"
                disabled={!isConnected}
              >
                주소 보기
              </Button>
            <Button
              onClick={handleCreateSafe}
              size="sm"
                className="w-28"
                disabled={!isConnected || isCreatingSafe}
            >
              <Plus className="mr-2 h-4 w-4" />
              {isCreatingSafe ? "생성 중..." : "Safe 생성"}
            </Button>
              <Button
                onClick={handleCreateGuard}
                size="sm"
                variant="secondary"
                className="w-28"
                disabled={!isConnected || !safeAddress || isCreatingGuard}
              >
                {isCreatingGuard ? "적용 중..." : "Guard 적용"}
              </Button>
              <Button
                onClick={handleFetchPendingTransactions}
                size="sm"
                variant="outline"
                className="w-24"
                disabled={!isConnected || isPendingLoading}
              >
                {isPendingLoading ? "조회 중..." : "대기 TX"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">총 자산</p>
              <p className="text-3xl font-bold text-foreground">
              {isBalanceLoading
                ? "Loading..."
                : safeBalance
                ? `${safeBalance.formatted} ${safeBalance.symbol}`
                : "-"}
              </p>
            </div>
            <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
              Sepolia
            </Badge>
          </div>

          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="입금할 ETH 금액"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="flex-1"
                  step="0.001"
                  min="0"
                  disabled={!isConnected || !safeAddress}
                />
                <span className="text-sm text-muted-foreground">ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="출금할 ETH 금액"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="flex-1"
                  step="0.001"
                  min="0"
                  disabled={!isConnected || !safeAddress}
                />
                <span className="text-sm text-muted-foreground">ETH</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleDeposit} 
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={!isConnected || !safeAddress || isDepositing || !depositAmount}
              >
              <ArrowDownLeft className="mr-2 h-4 w-4" />
                {isDepositing ? "입금 중..." : "입금"}
            </Button>
              <Button 
                onClick={handleWithdraw} 
                variant="outline" 
                className="flex-1 bg-transparent"
                disabled={!isConnected || !safeAddress || isWithdrawing || !withdrawAmount}
              >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              {isWithdrawing ? "출금 중..." : "출금"}
            </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingTransactions.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">대기 중 트랜잭션</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingTransactions.map((tx: any) => (
              <div key={tx.safeTxHash} className="rounded-md border border-border px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nonce: {tx.nonce}</p>
                    <p className="text-xs text-muted-foreground break-all">Hash: {tx.safeTxHash}</p>
                    <p className="text-xs text-muted-foreground">Value: {ethers.formatEther(tx.value || "0")} ETH</p>
                    <p className="text-xs text-muted-foreground">
                      Confirmations: {tx.confirmations}/{tx.confirmationsRequired}
                    </p>
                  </div>
                  {tx.txServiceUrl && (
                    <a
                      href={tx.txServiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >
                      Safe Web App
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
