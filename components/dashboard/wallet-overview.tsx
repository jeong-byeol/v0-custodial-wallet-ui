"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useWeb3Auth } from "@web3auth/modal/react"
import { useWeb3AuthConnect } from "@web3auth/modal/react"
import { useAccount, useBalance } from "wagmi";
import { useState } from "react";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
// wagmi 사용으로 별도 rpc 클라이언트 설정 불필요

export function WalletOverview() {
  const totalBalance = "1.2345 ETH"
  const { web3Auth } = useWeb3Auth();
  const { isConnected } = useWeb3AuthConnect();
  const { address } = useAccount();
  const [safeAddress, setSafeAddress] = useState<string>("");

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


  const handleCreateSafe = async () => {
    try {
      // web3Auth가 아직 초기화되지 않았거나 로그인 전인 경우 방어적으로 종료
      if (!web3Auth) {
        console.error("Web3Auth가 아직 준비되지 않았습니다.");
        return;
      }

      // ID 토큰 추출 (백엔드 인증용)
      const identityTokenInfo = await web3Auth.getIdentityToken();
      const idtoken = identityTokenInfo.idToken;
      if (!idtoken) {
        console.error("ID 토큰을 가져오지 못했습니다.");
        return;
      }
      // 사용자 email 조회
      const latestUserInfo = await web3Auth.getUserInfo();
      const userEmail = latestUserInfo?.email;
      // safe api 호출
      const response = await fetch(`${apiBaseUrl}/api/v1/safe/create-safe`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idtoken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail, userAddress: address }),
      });

      const safeAddress = await response.text();
      
      setSafeAddress(safeAddress);


    } catch (error) {
      console.error("Safe 생성 실패:", error);
    }
  }

  const handleCopyAddress = () => {
    // 로그인 상태가 아니거나 Safe 주소가 없으면 복사하지 않음
    if (!isConnected || !safeAddress) return;
    navigator.clipboard.writeText(safeAddress)
  }

  const handleDeposit = () => {
    console.log("입금")
  }

  const handleWithdraw = () => {
    console.log("출금")
  }

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">지갑 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            {isConnected && (
              // 로그인한 경우에만 Safe 주소를 노출
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Safe Address</p>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-foreground">{safeAddress}</code>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress} disabled={!safeAddress}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            <Button
              onClick={handleCreateSafe}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!isConnected}
              title={!isConnected ? "로그인 후 이용 가능합니다" : undefined}
            >
              <Plus className="mr-2 h-4 w-4" />
              Safe 생성/보기
            </Button>
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

          <div className="flex gap-2 pt-2">
            <Button onClick={handleDeposit} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              입금
            </Button>
            <Button onClick={handleWithdraw} variant="outline" className="flex-1 bg-transparent">
              <ArrowUpRight className="mr-2 h-4 w-4" />
              출금
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
