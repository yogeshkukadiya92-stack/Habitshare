'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { KRA } from '@/lib/types';
import { ChartConfig, ChartContainer } from '@/components/ui/chart';

interface KraProgressChartProps {
  kras: KRA[];
}

const statusColors: { [key: string]: string } = {
  'On Track': 'hsl(var(--chart-2))',
  'At Risk': 'hsl(var(--chart-4))',
  'Completed': 'hsl(var(--chart-1))',
  'Pending': 'hsl(var(--muted))',
};

const chartConfig = {
    kras: {
      label: "KRAs",
    },
    'On Track': {
        label: 'On Track',
        color: statusColors['On Track'],
    },
    'At Risk': {
        label: 'At Risk',
        color: statusColors['At Risk'],
    },
    'Completed': {
        label: 'Completed',
        color: statusColors['Completed'],
    },
    'Pending': {
        label: 'Pending',
        color: statusColors['Pending'],
    },
} satisfies ChartConfig

export function KraProgressChart({ kras }: KraProgressChartProps) {
  const data = React.useMemo(() => {
    const statusCounts: { [key: string]: number } = {
      'On Track': 0,
      'At Risk': 0,
      'Completed': 0,
      'Pending': 0,
    };

    kras.forEach((kra) => {
      if (statusCounts[kra.status] !== undefined) {
        statusCounts[kra.status]++;
      }
    });

    return Object.keys(statusCounts)
      .map((status) => ({
        name: status,
        value: statusCounts[status],
        fill: statusColors[status],
      }))
      .filter((entry) => entry.value > 0);
  }, [kras]);

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>KRA Status Overview</CardTitle>
        <CardDescription>A distribution of the employee's KRA statuses.</CardDescription>
      </CardHeader>
      <CardContent>
         <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                    return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central">
                        {`${(percent * 100).toFixed(0)}%`}
                        </text>
                    );
                 }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
