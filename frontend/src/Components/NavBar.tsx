import "./Navbar.css";

function NavBar() {
    return (
        <nav className="navbar">
            <div className="navbar-right">
                <a
                    href="https://github.com/charly1616/LAirPrope"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    <i className="fa-brands fa-github" style={{fontSize:32}}></i>
                </a>


                <a href="#about" className="nav-item">About</a>
            </div>
            <div className="navbar-center">
                <img
                    src="/LAirPrope_icon.png"
                    alt="logo"
                    className="navbar-logo"
                />
                <span className="navbar-title">LAirPrope</span>
            </div>

            <div className="navbar-right">
                <a href="#intro" className="nav-item">Intro</a>
                <a href="#model" className="nav-item">Model</a>
                <a href="#fqa" className="nav-item">FAQ</a>
            </div>
            
        </nav>
    );
}

export default NavBar;
