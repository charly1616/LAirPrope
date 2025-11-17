
import './App.css'
import FooterLAir from './Components/Footer.tsx'
import NavBar from './Components/NavBar.tsx'
import FirstImpression from './Sections/FirstImpression.tsx'
import DataSection from './Sections/DataSection.tsx'
import ModelDetails from './Sections/ModelDetails.tsx'
import ActionSection from './Sections/ActionsSection.tsx'
import FQALLM from './Sections/FQALLM.tsx'


function Page() {

  return (
    <>
      <NavBar/>
      <FirstImpression/>
      <DataSection/>
      <ModelDetails/>
      <ActionSection/>
      <FQALLM/>
      <FooterLAir/>
    </>
  )
}

export default Page
