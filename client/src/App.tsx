import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/HomeNew";
import Admin from "./pages/AdminNew";
import AdminLogin from "./pages/AdminLogin";
import AuthPage from "./pages/AuthPage";

// Páginas do Bot Telegram (adicionadas)
import Pix from "./pages/Pix";
import Extrato from "./pages/Extrato";
import Afiliados from "./pages/Afiliados";
import Conta from "./pages/Conta";
import About from "./pages/About";

function Router() {
  return (
    <Switch>
      {/* Rotas Originais Preservadas */}
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/wallet" component={Home} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/admin" component={Admin} />
      
      {/* Rotas de Integração do Telegram */}
      <Route path="/telegram" component={Pix} />
      <Route path="/telegram/pix" component={Pix} />
      <Route path="/telegram/extrato" component={Extrato} />
      <Route path="/telegram/afiliados" component={Afiliados} />
      <Route path="/telegram/conta" component={Conta} />
      <Route path="/about" component={About} />
      <Route path="/telegram/about" component={About} />
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.14 0.03 250)",
                border: "1px solid oklch(0.28 0.07 250 / 0.6)",
                color: "oklch(0.95 0.02 250)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
