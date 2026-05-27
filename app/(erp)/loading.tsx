import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ErpLoading() {
  return (
    <section className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-9 w-72 rounded bg-hover" />
        <div className="h-5 w-[540px] max-w-full rounded bg-hover" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="card-kpi">
            <CardHeader className="border-none pb-2">
              <div className="h-4 w-28 rounded bg-hover" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-8 w-24 rounded bg-hover" />
              <div className="h-5 w-32 rounded-full bg-hover" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
