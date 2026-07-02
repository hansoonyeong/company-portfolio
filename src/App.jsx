import {
  createBrowserRouter,
  RouterProvider,
  Outlet,
  useMatches,
  ScrollRestoration,
  Navigate,
  useLocation,
  useParams,
} from 'react-router-dom'
import { LanguageProvider } from './i18n/LanguageContext'
import { QuoteCartProvider, useQuoteCart } from './context/QuoteCartContext'
import { ProjectsProvider } from './context/ProjectsContext'
import { HeroProvider } from './context/HeroContext'
import PageTitle from './components/PageTitle'
import Header from './components/Header'
import Footer from './components/Footer'
import QuoteCartBar from './components/QuoteCartBar'
import HomePage from './pages/HomePage'
import PricingPage from './pages/PricingPage'
import NewsPage from './pages/NewsPage'
import WorksPage from './pages/WorksPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import LegalPage from './pages/LegalPage'
import AdminPage from './pages/AdminPage'
import ScrollRevealManager from './components/ScrollRevealManager'

function CartShell() {
  const cart = useQuoteCart()
  const location = useLocation()

  if (location.pathname === '/contact') return null

  return <QuoteCartBar items={cart.items} />
}

function LegacyWorkRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/work/${slug}`} replace />
}

function RootLayout() {
  const matches = useMatches()
  const page = [...matches].reverse().find((match) => match.handle?.page)?.handle?.page ?? 'meta'

  return (
    <>
      <PageTitle page={page} />
      <ScrollRestoration />
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollRevealManager />
      <CartShell />
    </>
  )
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage />, handle: { page: 'meta' } },
      { path: 'news', element: <NewsPage />, handle: { page: 'newsPage' } },
      { path: 'works', element: <WorksPage />, handle: { page: 'worksPage' } },
      { path: 'work/:slug', element: <ProjectDetailPage />, handle: { page: 'worksPage' } },
      { path: 'works/:slug', element: <LegacyWorkRedirect />, handle: { page: 'worksPage' } },
      { path: 'about', element: <AboutPage />, handle: { page: 'aboutPage' } },
      { path: 'services', element: <PricingPage />, handle: { page: 'servicesPage' } },
      { path: 'pricing', element: <Navigate to="/services" replace /> },
      { path: 'contact', element: <ContactPage />, handle: { page: 'contactPage' } },
      { path: 'privacy', element: <LegalPage type="privacy" />, handle: { page: 'meta' } },
      { path: 'terms', element: <LegalPage type="terms" />, handle: { page: 'meta' } },
    ],
  },
  { path: '/admin', element: <AdminPage /> },
])

export default function App() {
  return (
    <LanguageProvider>
      <HeroProvider>
        <ProjectsProvider>
          <QuoteCartProvider>
            <RouterProvider router={router} />
          </QuoteCartProvider>
        </ProjectsProvider>
      </HeroProvider>
    </LanguageProvider>
  )
}
