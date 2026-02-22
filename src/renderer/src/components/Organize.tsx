import { Link } from 'react-router-dom'

export default function Organize(): React.JSX.Element {
    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h1>Organize Your Clutter!</h1>
            <p>This is the placeholder for the main organization screen.</p>
            <div style={{ marginTop: '20px' }}>
                <Link to="/">Back to Login</Link>
            </div>
        </div>
    )
}
