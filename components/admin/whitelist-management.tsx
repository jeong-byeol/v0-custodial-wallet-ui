"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, CheckCircle2 } from "lucide-react"

interface WhitelistAddress {
  id: string
  address: string
  addedAt: string
  status: "active" | "removed"
}

const mockWhitelist: WhitelistAddress[] = [
  { id: "1", address: "0x9876543210fedcba9876543210fedcba98765432", addedAt: "2024-01-10", status: "active" },
  { id: "2", address: "0xfedcbafedcbafedcbafedcbafedcbafedcbafed", addedAt: "2024-01-12", status: "active" },
]

export function WhitelistManagement() {
  const [whitelist, setWhitelist] = useState<WhitelistAddress[]>(mockWhitelist)
  const [newAddress, setNewAddress] = useState("")

  const handleAddAddress = () => {
    if (newAddress) {
      const newWhitelistAddress: WhitelistAddress = {
        id: Date.now().toString(),
        address: newAddress,
        addedAt: new Date().toISOString().split("T")[0],
        status: "active",
      }
      setWhitelist([...whitelist, newWhitelistAddress])
      setNewAddress("")
    }
  }

  const handleRemoveAddress = (id: string) => {
    setWhitelist(whitelist.map((item) => (item.id === id ? { ...item, status: "removed" as const } : item)))
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <CheckCircle2 className="h-5 w-5 text-accent" />
          화이트리스트 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="whitelist-address" className="text-foreground">
            화이트리스트 주소 추가
          </Label>
          <div className="flex gap-2">
            <Input
              id="whitelist-address"
              placeholder="0x..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              className="font-mono bg-background text-foreground border-input"
            />
            <Button onClick={handleAddAddress} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">화이트리스트 목록</Label>
          <div className="space-y-2">
            {whitelist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-foreground">{item.address}</code>
                    <Badge
                      variant={item.status === "active" ? "default" : "secondary"}
                      className={item.status === "active" ? "bg-accent text-accent-foreground" : ""}
                    >
                      {item.status === "active" ? "활성" : "삭제됨"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">추가일: {item.addedAt}</p>
                </div>
                {item.status === "active" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveAddress(item.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
