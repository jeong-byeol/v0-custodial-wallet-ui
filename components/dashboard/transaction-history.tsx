"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useWeb3Auth } from "@web3auth/modal/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownLeft, Loader2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? ""

type DirectionFilter = "IN" | "OUT" | "ALL"
type StatusFilter = "PENDING" | "SUCCESS" | "FAILED" | "ALL"

export function TransactionHistory() {
  const { web3Auth } = useWeb3Auth()
  const searchParams = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState("")
  const [historyData, setHistoryData] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [directionFilter, setDirectionFilter] = useState<DirectionFilter>("ALL")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [refreshCounter, setRefreshCounter] = useState(0)

  useEffect(() => {
    if (!web3Auth) return

    const fetchHistory = async () => {
      try {
        setIsLoading(true)
        setError("")

        const [identityTokenInfo, userInfo] = await Promise.all([
          web3Auth.getIdentityToken(),
          web3Auth.getUserInfo(),
        ])

        const idToken = identityTokenInfo?.idToken ?? ""
        const userEmail = userInfo?.email ?? ""

        if (!idToken || !userEmail) {
          throw new Error("사용자 인증 정보를 가져오지 못했습니다.")
        }

        const queryParams = new URLSearchParams({
          email: userEmail,
          page: String(page),
          limit: String(limit),
          direction: directionFilter,
          status: statusFilter,
          sortBy: "block_timestamp",
          sortOrder: "desc",
        })

        const url = `${apiBaseUrl}/api/v1/user/transaction-history?${queryParams.toString()}`
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        })

        if (!response.ok) {
          throw new Error(`조회 실패: ${response.status}`)
        }

        const data = await response.json()
        setHistoryData(data)
      } catch (err: any) {
        console.error("거래 내역 조회 실패:", err)
        setError(err?.message ?? "오류가 발생했습니다.")
        setHistoryData(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [web3Auth, page, limit, directionFilter, statusFilter, refreshCounter])

  // 한글 주석: Safe API 동기화 후 새로고침
  const handleSyncAndRefresh = async () => {
    try {
      setIsSyncing(true)

      if (!web3Auth) {
        throw new Error("Web3Auth가 준비되지 않았습니다.")
      }

      const [identityTokenInfo, userInfo] = await Promise.all([
        web3Auth.getIdentityToken(),
        web3Auth.getUserInfo(),
      ])

      const idToken = identityTokenInfo?.idToken ?? ""
      const userEmail = userInfo?.email ?? ""

      if (!idToken || !userEmail) {
        throw new Error("사용자 인증 정보를 가져오지 못했습니다.")
      }

      const response = await fetch(`${apiBaseUrl}/api/v1/tx/sync-transactions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      })

      if (response.ok) {
        const syncResult = await response.json()
        console.log("동기화 완료:", syncResult)
        alert(`${syncResult.synced}개의 트랜잭션이 동기화되었습니다.`)
        setRefreshCounter(prev => prev + 1)
      } else {
        const errorResponse = await response.json().catch(() => null)
        const errorMessage = errorResponse?.message || `HTTP ${response.status}`
        throw new Error(errorMessage)
      }
    } catch (err: any) {
      console.error("동기화 실패:", err)
      alert(`동기화에 실패했습니다: ${err?.message || "알 수 없는 오류"}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const transactions = historyData?.transactions ?? []
  const pagination = historyData?.pagination
  const stats = historyData?.stats

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-card-foreground">거래 내역</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as DirectionFilter)}
              className="w-24 rounded-md border px-2 py-1 text-sm"
            >
              <option value="ALL">전체</option>
              <option value="IN">입금</option>
              <option value="OUT">출금</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-24 rounded-md border px-2 py-1 text-sm"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">대기</option>
              <option value="SUCCESS">성공</option>
              <option value="FAILED">실패</option>
            </select>

            <Input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => {
                const val = Number(e.target.value) || 20
                setLimit(Math.min(Math.max(val, 1), 100))
                setPage(1)
              }}
              className="w-20 text-sm"
              placeholder="limit"
            />

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncAndRefresh} 
              disabled={isLoading || isSyncing}
              className="border-green-500 text-green-600"
            >
              <RefreshCcw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "동기화 중..." : "동기화"}
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setRefreshCounter(prev => prev + 1)} 
              disabled={isLoading || isSyncing}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              새로고침
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatsItem label="총 입금" value={`${stats.total_deposits?.total_eth || "0"} ETH (${stats.total_deposits?.count || 0}건)`} />
              <StatsItem label="총 출금" value={`${stats.total_withdrawals?.total_eth || "0"} ETH (${stats.total_withdrawals?.count || 0}건)`} />
              <StatsItem label="가스비" value={`${stats.total_fees?.total_eth || "0"} ETH`} />
              <StatsItem label="순 잔액" value={`${stats.net_balance?.net_eth || "0"} ETH`} />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              거래 내역을 불러오는 중...
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">표시할 거래 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => {
                const isDeposit = tx.direction === "IN"

                return (
                  <div
                    key={tx.id}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${isDeposit ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>
                          {isDeposit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">{isDeposit ? "입금" : "출금"}</p>
                          <p className="text-xs text-muted-foreground">
                            {tx.status === "SUCCESS" ? "성공" : tx.status === "PENDING" ? "대기" : "실패"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          {isDeposit ? "+" : "-"}{tx.amount_eth} ETH
                        </p>
                        {tx.fee_paid_eth && (
                          <p className="text-xs text-muted-foreground">가스비: {tx.fee_paid_eth} ETH</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase">TX Hash</p>
                        <a href={tx.explorer_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline break-all">
                          {tx.tx_hash}
                        </a>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase">블록 시간</p>
                        <p className="text-xs">{tx.block_timestamp ? new Date(tx.block_timestamp).toLocaleString() : "-"}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {pagination && (
            <div className="flex items-center justify-between border-t pt-4">
              <div className="text-xs text-muted-foreground">
                페이지 {pagination.page} / {pagination.totalPages} · 총 {pagination.totalCount}건
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))} 
                  disabled={!pagination.hasPrevious || isLoading}
                >
                  이전
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(prev => prev + 1)} 
                  disabled={!pagination.hasNext || isLoading}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatsItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  )
}
