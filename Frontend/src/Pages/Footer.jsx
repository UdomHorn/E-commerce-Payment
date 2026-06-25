import React from 'react'
import img12 from '../assets/Images/We-accept-payments.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMobileScreenButton, faFaceAngry } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
// import {faFacebookF} from '@fortawesome/free-brands-svg-icons'
const Footer = () => {
  const { user } = useAuth();
  return (
    <div className='w-full bg-footer-0 text-white font-roboto pt-6'>
      <div className='w-[75%] max-md:w-[94%] max-md:justify-around max-sm:justify-between  text-white font-roboto flex justify-between items-center m-auto py-4 '>
        <div className='max-md:hidden  '>
          <div className='text-lg font-bold pb-4'>TEN11 App</div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p >IOS App</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>Android App</p>
          </div>
        </div>

        <div className=''>
          <div className='text-lg font-bold pb-4'>Follow Us</div>
          <div className='flex items-center gap-2'>
            {/* <FontAwesomeIcon icon={faFacebookF} /> */}
            <p >Facebook</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>Instagram</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>Tiktok</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>Telegram</p>
          </div>
        </div>

        <div className=' '>
          <div className='text-lg font-bold pb-4'>Customer Services</div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faFaceAngry} />
            <p >Online exchange policy</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>Privacy Policy</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>FAQs & guides</p>
          </div>
          <div className='flex items-center gap-2'>
            <FontAwesomeIcon icon={faMobileScreenButton} />
            <p>About Us</p>
          </div>
          {user?.role === 'admin' && (
            <div className='flex items-center gap-2 border-t border-white/20 pt-2 mt-2'>
              <FontAwesomeIcon icon={faMobileScreenButton} />
              <Link to="/admin/upload" className="hover:underline text-teal-400 font-bold">Admin Panel (Upload)</Link>
            </div>
          )}
        </div>

        <div className='max-md:hidden '>
          <div className='text-lg font-bold pb-4'>We Accept</div>
          <div className='w-[170px]'>
            <img src={img12} alt="" />
          </div>

        </div>

      </div>
      <div className='max-md:w-[94%] m-auto hidden max-md:block '>
        <div className='text-lg font-bold pb-4'>We Accept</div>
        <div className='w-[300px]'>
          <img src={img12} alt="" />
        </div>

      </div>
    </div>
  )
}

export default Footer