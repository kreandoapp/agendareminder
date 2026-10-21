import Agenda from '../../pages/agenda/Agenda'

import Settings from '../../pages/settings/Settings'

import Clients from '../../pages/clients/Clients'

import Employees from '../../pages/employees/Employees'

import Services from '../../pages/services/Services'

import Countries from '../../pages/countries/Countries'

import Languages from '../../pages/languages/Languages'

import AdminLayout from '../../pages/adminlayout/AdminLayout'

import AdminDashboard from '../admin/AdminDashboard'

import Home from '../home/Home'

import WhatsAppStatus from '../whatsapp/WhatsAppStatus'

import Automations from '../automations/Automations'

import Hours from '../hours/Hours'

import Layout from '../../pages/layout/Layout'



export default function AppPages({

  currentPage,

  user,

  whatsappConnected,

  whatsappPhone,

  navigate,

  onDisconnectWhatsApp,

}) {

  return (

    <>

      {currentPage === 'admin-dashboard' && (

        <AdminDashboard

          user={user}

          navigate={navigate}

        />

      )}



      {currentPage === 'home' && (

        <Home

          user={user}

          whatsappConnected={whatsappConnected}

          whatsappPhone={whatsappPhone}

          navigate={navigate}

        />

      )}



      {currentPage === 'agenda' && (

        <Agenda

          user={user}

          navigate={navigate}

        />

      )}



      {currentPage === 'clients' && (

        <Clients

          user={user}

        />

      )}



      {currentPage === 'employees' && (

        <Employees

          user={user}

        />

      )}



      {currentPage === 'services' && (

        <Services

          user={user}

        />

      )}



      {currentPage === 'countries' && (

        <Countries

          user={user}

        />

      )}



      {currentPage === 'languages' && (

        <Languages

          user={user}

        />

      )}



      {/* =====================================================*

          PLANTILLAS ADMIN

          ===================================================== */}

      {currentPage === 'admin-templates' && (

        <AdminLayout

          user={user}

        />

      )}



      {/* =====================================================*

          PLANTILLAS DEL NEGOCIO

          ===================================================== */}

      {currentPage === 'layout' && (

        <Layout

          user={user}

        />

      )}



      {currentPage === 'whatsapp' && (

        <WhatsAppStatus

          whatsappConnected={

            whatsappConnected

          }

          whatsappPhone={

            whatsappPhone

          }

          onDisconnect={

            onDisconnectWhatsApp

          }

        />

      )}



      {currentPage === 'hours' && (

        <Hours

          user={user}

        />

      )}



      {currentPage === 'automations' && (

        <Automations

          user={user}

        />

      )}



      {currentPage === 'settings' && (

        <Settings

          user={user}

        />

      )}

    </>

  )

}
