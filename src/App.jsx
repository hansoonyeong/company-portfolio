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
import ScrollRevealManager from './components/ScrollRevealManager'
import WeddingLayout from './wedding/WeddingLayout'
import WeddingPage from './wedding/pages/WeddingPage'
import WeddingAdminPage from './wedding/pages/WeddingAdminPage'
import { AdminAuthProvider } from './admin/AdminAuthContext'
import AdminLayout from './admin/AdminLayout'
import OfficePage from './admin/office/OfficePage'
import DashboardPage from './admin/pages/DashboardPage'
import TodayPage from './admin/pages/TodayPage'
import InboxPage from './admin/pages/InboxPage'
import AiTeamPage from './admin/pages/AiTeamPage'
import TasksPage from './admin/pages/TasksPage'
import NotesPage from './admin/pages/NotesPage'
import FilesPage from './admin/pages/FilesPage'
import SettingsPage from './admin/pages/SettingsPage'
import ProjectsPage from './admin/pages/ProjectsPage'
import OfficeProjectPage from './admin/pages/OfficeProjectPage'
import ChatPage from './admin/pages/ChatPage'
import AdminWebsitePanel from './admin/website/AdminWebsitePanel'

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

function AdminRoot() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
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
  {
    path: '/admin',
    element: <AdminRoot />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="office" replace /> },
          { path: 'office', element: <OfficePage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'today', element: <TodayPage /> },
          { path: 'inbox', element: <InboxPage /> },
          { path: 'ai-team', element: <AiTeamPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'projects/:id', element: <OfficeProjectPage /> },
          { path: 'tasks', element: <TasksPage /> },
          { path: 'chat', element: <ChatPage /> },
          { path: 'notes', element: <NotesPage /> },
          { path: 'files', element: <FilesPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'website/quotes', element: <AdminWebsitePanel tab="quotes" /> },
          { path: 'website/news', element: <AdminWebsitePanel tab="news" /> },
          { path: 'website/hero', element: <AdminWebsitePanel tab="hero" /> },
          { path: 'website/portfolio', element: <AdminWebsitePanel tab="projects" /> },
        ],
      },
    ],
  },
  {
    element: <WeddingLayout />,
    children: [
      { path: '/wedding', element: <WeddingPage /> },
      { path: '/wedding/admin', element: <WeddingAdminPage /> },
    ],
  },
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
