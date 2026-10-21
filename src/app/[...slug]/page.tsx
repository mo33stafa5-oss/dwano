import App from '../../components/App';export default async function Page({params}:{params:Promise<{slug:string[]}>}){const {slug}=await params;return <App path={'/'+slug.join('/')}/>}
