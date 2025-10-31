"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface Transaction {
  id: string
  type: "deposit" | "withdraw"
  amount: string
  address: string
  timestamp: string
  status: "completed" | "pending" | "failed"
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: "0.5 ETH",
    address: "0x1234...5678",
    timestamp: "2024-01-15 14:30",
    status: "completed",
  },
  {
    id: "2",
    type: "withdraw",
    amount: "0.2 ETH",
    address: "0xabcd...efgh",
    timestamp: "2024-01-14 10:15",
    status: "completed",
  },
  {
    id: "3",
    type: "deposit",
    amount: "1.0 ETH",
    address: "0x9876...4321",
    timestamp: "2024-01-13 16:45",
    status: "completed",
  },
]

export function TransactionHistory() {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">거래 내역</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    tx.type === "deposit" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                  }`}
                >
                  {tx.type === "deposit" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">{tx.type === "deposit" ? "입금" : "출금"}</p>
                  <p className="text-sm text-muted-foreground">{tx.address}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{tx.amount}</p>
                <p className="text-xs text-muted-foreground">{tx.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
