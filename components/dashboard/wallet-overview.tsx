"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react"

export function WalletOverview() {
  const safeAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  const totalBalance = "1.2345 ETH"

  const handleCreateSafe = () => {
    console.log("Safe 주소 생성")
  }

  const handleCopyAddress = () => {
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
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Safe Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-foreground">{safeAddress}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyAddress}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <Button
              onClick={handleCreateSafe}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Safe 생성
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">총 자산</p>
              <p className="text-3xl font-bold text-foreground">{totalBalance}</p>
              <p className="text-sm text-muted-foreground mt-1">≈ $2,345.67 USD</p>
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
