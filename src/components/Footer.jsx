import { Link } from 'react-router-dom';
import { TbLeaf, TbBrandTwitter, TbBrandInstagram, TbBrandLinkedin, TbMail, TbArrowRight } from 'react-icons/tb';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="footer__glow" />
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <div className="footer__logo">
              <TbLeaf size={20} />
              <span>Cyclos</span>
            </div>
            <p className="footer__tagline">
              Building the circular economy, one product at a time. 
              Turn waste into wealth, together.
            </p>
            <div className="footer__social">
              <a href="#" className="footer__social-link" aria-label="Twitter"><TbBrandTwitter size={18} /></a>
              <a href="#" className="footer__social-link" aria-label="Instagram"><TbBrandInstagram size={18} /></a>
              <a href="#" className="footer__social-link" aria-label="LinkedIn"><TbBrandLinkedin size={18} /></a>
              <a href="mailto:hello@cyclos.earth" className="footer__social-link" aria-label="Email"><TbMail size={18} /></a>
            </div>
          </div>

          <div className="footer__links-grid">
            <div className="footer__col">
              <h4>Platform</h4>
              <a href="#">Marketplace</a>
              <a href="#">AI Scanner</a>
              <a href="#">Dashboard</a>
              <a href="#">Chatbot</a>
            </div>
            <div className="footer__col">
              <h4>Company</h4>
              <a href="#">About Us</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
            </div>
            <div className="footer__col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>

        <div className="footer__newsletter">
          <div>
            <h3>Stay in the loop</h3>
            <p>Get waste management tips and platform updates.</p>
          </div>
          <div className="footer__newsletter-form">
            <input type="email" placeholder="Enter your email" className="input-field footer__input" />
            <button className="btn-primary footer__sub-btn">
              <span><TbArrowRight size={18} /></span>
            </button>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© 2026 Cyclos Earth Pvt. Ltd. · Built for a greener planet 🌱</p>
          <p>Compliant with SWM Rules 2026</p>
        </div>
      </div>
    </footer>
  );
}
