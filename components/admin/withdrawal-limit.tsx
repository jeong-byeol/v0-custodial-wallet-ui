"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DollarSign } from "lucide-react"

export function WithdrawalLimit() {
  const [dailyLimit, setDailyLimit] = useState("1.0")

  const handleUpdateLimit = () => {
    console.log("일일 출금 한도 업데이트:", dailyLimit)
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <DollarSign className="h-5 w-5 text-primary" />
          일일 출금 한도 설정
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="daily-limit" className="text-foreground">
            일일 출금 한도 (ETH)
          </Label>
          <div className="flex gap-2">
            <Input
              id="daily-limit"
              type="number"
              step="0.1"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              className="bg-background text-foreground border-input"
            />
            <Button onClick={handleUpdateLimit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              업데이트
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">현재 한도</span>
            <span className="font-semibold text-foreground">{dailyLimit} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">오늘 사용량</span>
            <span className="font-semibold text-foreground">0.2 ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">남은 한도</span>
            <span className="font-semibold text-accent">{(Number.parseFloat(dailyLimit) - 0.2).toFixed(1)} ETH</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
