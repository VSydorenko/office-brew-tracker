
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Coffee, Wallet, Users, ShieldCheck } from "lucide-react";

/**
 * Розширений список останніх покупок із даними про оплати, учасників і статус.
 */
export interface EnrichedPurchase {
  id: string;
  date: string;
  total_amount: number;
  distribution_status: string | null;
  buyer_name: string | null;
  participants_count: number;
  paid_count: number;
  unpaid_count: number;
  amount_paid: number;
  amount_unpaid: number;
}

export const RecentPurchasesList: React.FC<{ data: EnrichedPurchase[] }> = ({
  data,
}) => {
  if (!data?.length) {
    return (
      <Card className="shadow-coffee">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Coffee className="h-5 w-5 text-primary" />
            Останні покупки
          </CardTitle>
          <CardDescription className="text-sm">
            Нещодавні покупки кави в офісі
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="text-center py-6 md:py-8">
            <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm md:text-base">Покупок ще немає</p>
            <Button asChild className="mt-4 h-10 md:h-auto">
              <Link to="/purchases">Додати першу покупку</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-coffee">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Coffee className="h-5 w-5 text-primary" />
          Останні покупки
        </CardTitle>
        <CardDescription className="text-sm">
          Детальна інформація щодо оплати і статусів
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        <div className="space-y-3 md:space-y-4">
          {data.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 md:p-4 border border-border rounded-lg bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm md:text-base truncate">
                  {p.buyer_name || "Невідомо"}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {new Date(p.date).toLocaleDateString("uk-UA")}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {p.participants_count} учасн.
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {p.distribution_status || "draft"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5" />
                    {p.paid_count}/{p.unpaid_count} опл./неопл.
                  </span>
                </div>
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-primary text-sm md:text-base">
                  ₴{Number(p.total_amount).toFixed(0)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Опл: ₴{Number(p.amount_paid).toLocaleString("uk-UA")} / Борг: ₴
                  {Number(p.amount_unpaid).toLocaleString("uk-UA")}
                </p>
              </div>
            </div>
          ))}
          <div className="pt-2 md:pt-4">
            <Button asChild variant="outline" className="w-full h-10 md:h-auto">
              <Link to="/purchases">Переглянути всі покупки</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
