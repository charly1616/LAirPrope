import "./FooterLAir.css";

function FooterLAir() {
    return (
        <footer className="footer">
            <div className="footer-container">

                <div className="footer-logo">
                    <span className="logo-main">LAir</span>
                    <span className="logo-sub">Prope</span>
                </div>

                <p className="footer-description">
                    Monitoreo y proyección de calidad del aire en Colombia
                </p>

                <div className="footer-links">
                    <a href="#privacy" className="footer-link">Política de Privacidad</a>
                    <a href="#terms" className="footer-link">Términos de Servicio</a>
                    <a href="#contact" className="footer-link">Contacto</a>
                </div>

                <p className="footer-copy">
                    © {new Date().getFullYear()} LAirPrope. Todos los derechos reservados.
                </p>

            </div>
        </footer>
    );
}

export default FooterLAir;
