function Error({ statusCode }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            <h1 style={{ fontSize: '4rem', margin: '0' }}>{statusCode}</h1>
            <p style={{ color: '#666', margin: '1rem 0' }}>
                {statusCode === 404
                    ? 'Page not found'
                    : 'An error occurred'}
            </p>
            <a href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
                Return Home
            </a>
        </div>
    );
}

Error.getInitialProps = ({ res, err }) => {
    const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
    return { statusCode };
};

export default Error;
