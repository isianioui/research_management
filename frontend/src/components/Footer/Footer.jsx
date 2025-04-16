import React, { useState, forwardRef } from 'react';
import { Modal, Button } from 'react-bootstrap';
import ContactSection from '../ContactSection/ContactSection';
import './Footer.css';
import logo from '../../assets/logo.jpeg';

const Footer = forwardRef((props, ref) => {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <footer className="bg-dark text-light py-3" ref={ref}>
        <div className="container text-center">
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="d-flex align-items-center justify-content-center">
                <img src={logo} alt="Website Logo" className="footer-logo me-3" />
                <div className="text-start">
                  <h4 className="fw-bold mb-0">Research App</h4>
                  <p className="mb-0">Build fully functional accessible research app faster than ever</p>
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <h5 className="fw-bold">Follow Me</h5>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-linkedin"></i>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                  <i className="fab fa-github"></i>
                </a>
                <a href="mailto:example@email.com" target="_blank" rel="noopener noreferrer">
                  <i className="fas fa-envelope"></i>
                </a>
              </div>
            </div>

            <div className="col-md-4 mb-4">
              <Button variant="primary" onClick={handleShowModal} className="contact-button">
                Contact Us
              </Button>
            </div>
          </div>

          <hr className="bg-light" />
          <p className="mb-0">© {new Date().getFullYear()} Your Name. All Rights Reserved.</p>
        </div>
      </footer>

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered contentClassName="bg-dark">
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Contact Us</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <ContactSection />
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
});

export default Footer;

// import React, { useState } from 'react';
// import { Modal, Button } from 'react-bootstrap';
// import ContactSection from '../ContactSection/ContactSection'; // Import the ContactSection component
// import './Footer.css'; // Import the CSS file
// import logo from '../../assets/logo.jpeg';

// function Footer() {
//   const [showModal, setShowModal] = useState(false); // State to control modal visibility

//   const handleShowModal = () => setShowModal(true); // Function to show the modal
//   const handleCloseModal = () => setShowModal(false); // Function to hide the modal

//   return (
//     <>
//       {/* Footer */}
//       <footer className="bg-dark text-light py-3">
//         <div className="container text-center">
//           <div className="row">
//              {/* Website Logo, Name, and Slogan */}
//              <div className="col-md-4 mb-3">
//               <div className="d-flex align-items-center justify-content-center">
//                 <img
//                   src={logo}
//                   alt="Website Logo"
//                   className="footer-logo me-3"
//                 />
//                 <div className="text-start">
//                   <h4 className="fw-bold mb-0">Research App</h4>
//                   <p className="mb-0 ">Build fully functional accessible research app faster than ever</p>
//                 </div>
//               </div>
//             </div>
//             {/* Quick Links */}
//             {/* <div className="col-md-4 mb-4">
//               <h5 className="fw-bold">Quick Links</h5>
//               <ul className="list-unstyled">
//                 <li><a href="#" className="text-light text-decoration-none">Home</a></li>
//                 <li><a href="#" className="text-light text-decoration-none">About</a></li>
//                 <li><a href="#" className="text-light text-decoration-none">Services</a></li>
//                 <li><a href="#" className="text-light text-decoration-none">Contact</a></li>
//               </ul>
//             </div> */}

//             {/* Social Media Links */}
//             <div className="col-md-4 mb-4">
//               <h5 className="fw-bold">Follow Me</h5>
//               <div className="social-icons">
//               <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
//                   <i className="fab fa-facebook"></i>
//                 </a>
//                 <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
//                   <i className="fab fa-instagram"></i>
//                 </a>
//                 <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
//                   <i className="fab fa-linkedin"></i>
//                 </a>
//                 <a href="https://github.com" target="_blank" rel="noopener noreferrer">
//                   <i className="fab fa-github"></i>
//                 </a>
//                 <a href="mailto:example@email.com" target="_blank" rel="noopener noreferrer">
//                   <i className="fas fa-envelope"></i>
//                 </a>
//               </div>
//             </div>

//             {/* Contact Button */}
//             <div className="col-md-4 mb-4">
//               {/* <h5 className="fw-bold">Contact</h5> */}
//               <Button variant="primary" onClick={handleShowModal} className="contact-button">
//                 Contact Us
//               </Button>
//             </div>
//           </div>

//           <hr className="bg-light" />
//           <p className="mb-0">© {new Date().getFullYear()} Your Name. All Rights Reserved.</p>
//         </div>
//       </footer>

//       {/* Modal */}
//       <Modal 
//   show={showModal} 
//   onHide={handleCloseModal} 
//   size="lg" 
//   centered
//   contentClassName="bg-dark" // Add this for better dark theme integration
// >
//   <Modal.Header closeButton className="border-0">
//     <Modal.Title>Contact Us</Modal.Title>
//   </Modal.Header>
//   <Modal.Body className="px-4">
//     <ContactSection />
//   </Modal.Body>
//   <Modal.Footer className="border-0">
//     <Button variant="secondary" onClick={handleCloseModal}>
//       Close
//     </Button>
//   </Modal.Footer>
// </Modal>
//     </>
//   );
// }
// export default Footer;