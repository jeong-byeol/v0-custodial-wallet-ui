"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Shield } from "lucide-react"

interface Admin {
  id: string
  address: string
  addedAt: string
}

const mockAdmins: Admin[] = [
  { id: "1", address: "0x1234567890abcdef1234567890abcdef12345678", addedAt: "2024-01-10" },
  { id: "2", address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", addedAt: "2024-01-12" },
]

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>(mockAdmins)
  const [newAdminAddress, setNewAdminAddress] = useState("")

  const handleAddAdmin = () => {
    if (newAdminAddress) {
      const newAdmin: Admin = {
        id: Date.now().toString(),
        address: newAdminAddress,
        addedAt: new Date().toISOString().split("T")[0],
      }
      setAdmins([...admins, newAdmin])
      setNewAdminAddress("")
    }
  }

  const handleRemoveAdmin = (id: string) => {
    setAdmins(admins.filter((admin) => admin.id !== id))
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Shield className="h-5 w-5 text-primary" />
          관리자 관리
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="admin-address" className="text-foreground">
            관리자 주소 추가
          </Label>
          <div className="flex gap-2">
            <Input
              id="admin-address"
              placeholder="0x..."
              value={newAdminAddress}
              onChange={(e) => setNewAdminAddress(e.target.value)}
              className="font-mono bg-background text-foreground border-input"
            />
            <Button onClick={handleAddAdmin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">관리자 목록</Label>
          <div className="space-y-2">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <code className="text-sm font-mono text-foreground">{admin.address}</code>
                  <p className="text-xs text-muted-foreground mt-1">추가일: {admin.addedAt}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
