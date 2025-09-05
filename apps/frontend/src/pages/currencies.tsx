import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/tenant-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Badge,
  Input
} from '@/components/ui';
import { DollarSign, TrendingUp, Globe, Star, Plus } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isBase: boolean;
  lastUpdated: string;
}

const CurrenciesPage: React.FC = () => {
  const { } = useAuth();
  const { tenant } = useTenant();
  const [currencies, setCurrencies] = useState<Currency[]>([
    {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      exchangeRate: 1.00,
      isBase: true,
      lastUpdated: new Date().toISOString()
    },
    {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      exchangeRate: 0.85,
      isBase: false,
      lastUpdated: new Date().toISOString()
    },
    {
      code: 'GBP',
      name: 'British Pound',
      symbol: '£',
      exchangeRate: 0.73,
      isBase: false,
      lastUpdated: new Date().toISOString()
    },
    {
      code: 'JPY',
      name: 'Japanese Yen',
      symbol: '¥',
      exchangeRate: 110.25,
      isBase: false,
      lastUpdated: new Date().toISOString()
    },
    {
      code: 'CAD',
      name: 'Canadian Dollar',
      symbol: 'C$',
      exchangeRate: 1.25,
      isBase: false,
      lastUpdated: new Date().toISOString()
    }
  ]);

  // const [exchangeRateHistory] = useState([
  //   { date: '2024-01-01', USD: 1.00, EUR: 0.85, GBP: 0.73, JPY: 110.25, CAD: 1.25 },
  //   { date: '2024-01-02', USD: 1.00, EUR: 0.84, GBP: 0.74, JPY: 109.85, CAD: 1.26 },
  //   { date: '2024-01-03', USD: 1.00, EUR: 0.86, GBP: 0.72, JPY: 111.00, CAD: 1.24 },
  // ]);

  const convertAmount = (amount: number, fromCode: string, toCode: string): number => {
    const fromCurrency = currencies.find(c => c.code === fromCode);
    const toCurrency = currencies.find(c => c.code === toCode);
    
    if (!fromCurrency || !toCurrency) return amount;
    
    // Convert to base currency (USD) first, then to target currency
    const usdAmount = fromCurrency.isBase ? amount : amount / fromCurrency.exchangeRate;
    return toCurrency.isBase ? usdAmount : usdAmount * toCurrency.exchangeRate;
  };

  const handleUpdateRates = async () => {
    // In a real implementation, this would fetch from an external API
    console.log('Updating exchange rates...');
    // Simulate API call
    setTimeout(() => {
      setCurrencies(prev => prev.map(currency => ({
        ...currency,
        exchangeRate: currency.isBase ? 1.00 : currency.exchangeRate * (0.98 + Math.random() * 0.04),
        lastUpdated: new Date().toISOString()
      })));
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Currency Management</h1>
          <p className="text-muted-foreground">
            Manage multi-currency support for {tenant?.companyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleUpdateRates}>
            <TrendingUp className="mr-2 h-4 w-4" />
            Update Rates
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Currency
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Currency</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currencies.find(c => c.isBase)?.code || 'USD'}
            </div>
            <p className="text-xs text-muted-foreground">
              Default for calculations
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Currencies</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencies.length}</div>
            <p className="text-xs text-muted-foreground">
              Supported worldwide
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <p className="text-xs text-muted-foreground">
              Real-time rates
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sample Conversion</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{convertAmount(1000, 'USD', 'EUR').toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              From $1,000 USD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Currency Converter */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Currency Converter</CardTitle>
          <CardDescription>
            Convert amounts between supported currencies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" placeholder="1000" defaultValue="1000" />
            </div>
            <div>
              <label className="text-sm font-medium">From</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-center">
              <Button variant="outline" size="icon">
                ⇄
              </Button>
            </div>
            <div>
              <label className="text-sm font-medium">To</label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <Button>Convert</Button>
          </div>
        </CardContent>
      </Card>

      {/* Currencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exchange Rates</CardTitle>
          <CardDescription>
            Current exchange rates relative to your base currency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Currency</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Exchange Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.code}>
                  <TableCell className="font-medium">
                    {currency.name}
                    {currency.isBase && <Star className="inline ml-2 h-4 w-4 text-yellow-500" />}
                  </TableCell>
                  <TableCell>
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                      {currency.code}
                    </code>
                  </TableCell>
                  <TableCell className="font-bold text-lg">{currency.symbol}</TableCell>
                  <TableCell>
                    {currency.isBase ? '1.00 (Base)' : currency.exchangeRate.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={currency.isBase ? "default" : "success"}>
                      {currency.isBase ? 'Base' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(currency.lastUpdated).toLocaleTimeString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CurrenciesPage;