"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { WalletOverview } from "@/components/dashboard/wallet-overview"
import { TransactionHistory } from "@/components/dashboard/transaction-history"
import { BalanceChart } from "@/components/dashboard/balance-chart"
import { AdminManagement } from "@/components/admin/admin-management"
import { WhitelistManagement } from "@/components/admin/whitelist-management"
import { WithdrawalLimit } from "@/components/admin/withdrawal-limit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function Home() {
  const [safeAddress, setSafeAddress] = useState<string>("")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger
              value="dashboard"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              대시보드
            </TabsTrigger>
            <TabsTrigger
              value="admin"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              관리자 대시보드
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <WalletOverview safeAddress={safeAddress} onSafeAddressChange={setSafeAddress} />

            <div className="grid gap-6 md:grid-cols-2">
              <BalanceChart safeAddress={safeAddress} />
              <TransactionHistory />
            </div>
          </TabsContent>

          <TabsContent value="admin" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <AdminManagement />
              <WhitelistManagement />
            </div>

            <WithdrawalLimit />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
