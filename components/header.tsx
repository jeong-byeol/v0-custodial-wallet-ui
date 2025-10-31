"use client"

import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export function Header() {
  const handleLogin = () => {
    // Web3Auth 로그인 로직이 여기에 들어갑니다
    console.log("Web3Auth 로그인 시작")
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold text-foreground">Safe Custody Wallet</span>
        </div>

        <Button onClick={handleLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Web3Auth 로그인
        </Button>
      </div>
    </header>
  )
}
