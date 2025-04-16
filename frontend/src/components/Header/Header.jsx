import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.jpeg';
import './Header.css';

const Header = ({ footerRef }) => {
  const scrollToFooter = () => {
    if (footerRef && footerRef.current) {
      footerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header style={{ background: 'linear-gradient(135deg, #cec9ba, #7d7461)', color: '#fff' }}>
      <nav className="navbar navbar-expand-lg navbar-light container">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <img src={logo} alt="Logo" width="30" height="30" className="d-inline-block align-top" />
            <span style={{ color: '#635c51' }}>Research App</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link to="/">
                  <button className="btn me-2">Home</button>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/about">
                  <button className="btn me-2">About</button>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/services">
                  <button className="btn me-2">Services</button>
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/shop">
                  <button className="btn me-2">Pricing</button>
                </Link>
              </li>
              <li className="nav-item">
                <button className="btn me-2" onClick={scrollToFooter}>Contact</button>
              </li>
              <li className="nav-item">
                <Link to="/Auth">
                  <button className="btn me-2">Authentification</button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};





export default Header;
// import React from 'react';
// import { Link } from 'react-router-dom'; // Import Link for navigation
// import logo from '../../assets/logo.jpeg'; // Import logo from assets folder
// import './Header.css'
// function Header() {
//   return (
//     <header
//       style={{
//         background: 'linear-gradient(135deg, #cec9ba, #7d7461)',
//         color: '#fff',
//       }}
//     >
//       <nav className="navbar navbar-expand-lg navbar-light container">
//         <div className="container-fluid">
//           {/* Logo */}
//           <Link className="navbar-brand" to="/">
//             <img
//               src={logo}
//               alt="Logo"
//               width="30"
//               height="30"
//               className="d-inline-block align-top"
//             />
//             <span style={{ color: '#635c51' }}>Research App</span>
//           </Link>

//           {/* Toggle button for mobile responsiveness */}
//           <button
//             className="navbar-toggler"
//             type="button"
//             data-bs-toggle="collapse"
//             data-bs-target="#navbarNav"
//             aria-controls="navbarNav"
//             aria-expanded="false"
//             aria-label="Toggle navigation"
//           >
//             <span className="navbar-toggler-icon"></span>
//           </button>

//           {/* Navbar links */}
//           <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
//             <ul className="navbar-nav">
//               <li className="nav-item">
//                 <Link to="/">
//                   <button className="btn  me-2">Home</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/about">
//                   <button className="btn  me-2">About</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/services">
//                   <button className="btn  me-2">Services</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/shop">
//                   <button className="btn  me-2">Shop</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/contact">
//                   <button className="btn  me-2">Contact</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/Auth">
//                   <button className="btn  me-2">Authentification</button>
//                 </Link>
//               </li>
//               {/* <li className="nav-item">
//                 <Link to="/login">
//                   <button className="btn  me-2">Login</button>
//                 </Link>
//               </li>
//               <li className="nav-item">
//                 <Link to="/register">
//                   <button className="btn  me-2">Register</button>
//                 </Link>
//               </li> */}
//             </ul>
//           </div>
//         </div>
//       </nav>
//     </header>
//   );
// }

// export default Header;