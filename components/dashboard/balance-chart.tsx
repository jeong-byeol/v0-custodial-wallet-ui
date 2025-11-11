"use client"

import { useEffect, useState, useMemo } from "react"
import { useWeb3Auth } from "@web3auth/modal/react"
import { useBalance } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Loader2 } from "lucide-react"

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

const chartConfig = {
  balance: {
    label: "Balance",
    color: "hsl(var(--chart-1))",
  },
}

interface BalanceChartProps {
  safeAddress?: string
}

export function BalanceChart({ safeAddress }: BalanceChartProps) {
  const { web3Auth } = useWeb3Auth()
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<any[]>([])

  // 한글 주석: 현재 Safe 잔액 조회
  const { data: currentBalance } = useBalance({
    address: safeAddress ? (safeAddress as `0x${string}`) : undefined,
    chainId: 11155111,
    query: {
      enabled: Boolean(safeAddress),
    },
  })

  // 한글 주석: 거래 내역 조회 (최근 30일)
  useEffect(() => {
    if (!web3Auth || !safeAddress) return

    const fetchTransactions = async () => {
      try {
        setIsLoading(true)

        const [identityTokenInfo, userInfo] = await Promise.all([
          web3Auth.getIdentityToken(),
          web3Auth.getUserInfo(),
        ])

        const idToken = identityTokenInfo?.idToken ?? ""
        const userEmail = userInfo?.email ?? ""

        if (!idToken || !userEmail) return

        // 한글 주석: 최근 30일 전체 거래 내역 조회
        const queryParams = new URLSearchParams({
          email: userEmail,
          page: "1",
          limit: "100", // 충분한 개수
          direction: "ALL",
          status: "SUCCESS", // 성공한 트랜잭션만
          sortBy: "block_timestamp",
          sortOrder: "asc", // 오래된 순
        })

        const url = `${apiBaseUrl}/api/v1/user/transaction-history?${queryParams.toString()}`
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error("거래 내역 조회 실패:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions()
  }, [web3Auth, safeAddress])

  // 한글 주석: 거래 내역으로부터 일별 잔액 계산
  const chartData = useMemo(() => {
    if (!currentBalance || transactions.length === 0) {
      return []
    }

    // 현재 잔액 (ETH)
    const currentBalanceEth = parseFloat(currentBalance.formatted)

    // 한글 주석: 거래 내역을 날짜별로 그룹화
    const dailyTransactions = new Map<string, { deposits: number; withdrawals: number }>()

    transactions.forEach((tx: any) => {
      if (!tx.block_timestamp) return

      const date = new Date(tx.block_timestamp).toISOString().split("T")[0] // YYYY-MM-DD
      const amount = parseFloat(tx.amount_eth || "0")

      if (!dailyTransactions.has(date)) {
        dailyTransactions.set(date, { deposits: 0, withdrawals: 0 })
      }

      const daily = dailyTransactions.get(date)!
      if (tx.direction === "IN") {
        daily.deposits += amount
      } else if (tx.direction === "OUT") {
        daily.withdrawals += amount
      }
    })

    // 한글 주석: 최근 7일 데이터 생성
    const days = 7
    const result: Array<{ date: string; balance: number }> = []
    const today = new Date()

    // 한글 주석: 전체 입출금 합계로 초기 잔액 역산
    let totalDeposits = 0
    let totalWithdrawals = 0

    transactions.forEach((tx: any) => {
      const amount = parseFloat(tx.amount_eth || "0")
      if (tx.direction === "IN") {
        totalDeposits += amount
      } else if (tx.direction === "OUT") {
        totalWithdrawals += amount
      }
    })

    // 한글 주석: 초기 잔액 = 현재 잔액 - (총 입금 - 총 출금)
    let runningBalance = currentBalanceEth - (totalDeposits - totalWithdrawals)

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]
      const displayDate = `${date.getMonth() + 1}/${date.getDate()}`

      const daily = dailyTransactions.get(dateStr)
      if (daily) {
        runningBalance += daily.deposits - daily.withdrawals
      }

      result.push({
        date: displayDate,
        balance: Math.max(0, parseFloat(runningBalance.toFixed(4))),
      })
    }

    return result
  }, [currentBalance, transactions])

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-card-foreground">자산 추이 (최근 7일)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[200px] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">
              {safeAddress ? "거래 내역이 없습니다." : "Safe 주소를 먼저 확인해주세요."}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-muted-foreground" />
              <YAxis tickLine={false} axisLine={false} className="text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="var(--color-balance)"
                fill="url(#fillBalance)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

