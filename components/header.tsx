"use client"

import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import { useWeb3Auth, useWeb3AuthConnect, useWeb3AuthDisconnect, useWeb3AuthUser } from "@web3auth/modal/react";
import { useAccount } from "wagmi";

export function Header() {
  const { connect, isConnected, error: connectError, loading:  connectLoading } = useWeb3AuthConnect();
  const { disconnect, error: disconnectError, loading: disconnectLoading } = useWeb3AuthDisconnect();
  const { userInfo } = useWeb3AuthUser();
  const { address, connector } = useAccount();
  const { web3Auth } = useWeb3Auth();
  // 백엔드 API 베이스 URL 
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

  // 로그인 후 ID 토큰을 추출하는 핸들러
  const handleLogin = async () => {
    try {
      // Web3Auth 로그인 시도
      await connect();

      // web3Auth 인스턴스가 준비되었는지 확인
      if (!web3Auth) {
        console.error("Web3Auth 인스턴스가 초기화되지 않았습니다.");
        return;
      }

      // ID 토큰 추출
      const identityTokenInfo = await web3Auth.getIdentityToken();
      const idtoken = identityTokenInfo?.idToken;

      // 토큰이 없으면 중단
      if (!idtoken) {
        console.error("ID 토큰을 가져오지 못했습니다.");
        return;
      }

      // NestJS JwtAuthGuard는 일반적으로 Authorization: Bearer <token> 헤더를 기대
      await fetch(`${apiBaseUrl}/api/v1/auth/web3auth-login`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idtoken}`,
          "Content-Type": "application/json", // 요청 본문이 json형태라는 것을 서버에게 알리는 역할
        },
        body: JSON.stringify({}), // 바디가 필요 없더라도 JSON으로 명시
      })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log('응답 데이터:', data);
      })
    } catch (error) {
      console.error("로그인 실패:", error);
    }
  }

  const handleLogout = () => {
    disconnect();
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Safe Custody Wallet</span>
        </div>

        {isConnected ? (
          <Button onClick={handleLogout} className="bg-primary text-primary-foreground hover:bg-primary/90">
            로그아웃
          </Button>
        ) : (
          <Button onClick={handleLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
            로그인
          </Button>
        )}
      </div>
    </header>
  )
}
