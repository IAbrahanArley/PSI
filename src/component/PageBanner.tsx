import { StaticImageData } from "next/image";
import Link from "next/link";

interface Props{
    title : string,
    bnrimage : string | StaticImageData
}

function PageBanner({ title, bnrimage } : Props) {
    return (
        <>
            <div className="dz-bnr-inr dz-banner-dark overlay-secondary-middle dz-bnr-inr-md" style={{ backgroundImage: `url(${bnrimage})` }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry d-table-cell">
                        <h1 className="wow fadeInUp" data-wow-delay="0.2s" data-wow-duration="0.8s">{title}</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row wow fadeInUp" data-wow-delay="0.4s" data-wow-duration="0.8s">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link href="/">Home</Link></li>
                                <li className="breadcrumb-item">{title}</li>
                            </ul>
                        </nav>
                        <div className="dz-btn">
                            <Link href="tel:+11234567890" className="btn btn-lg btn-icon btn-primary radius-xl btn-shadow mb-3 mb-sm-0">
                                <span className="left-icon"> <i className="feather icon-phone-call" /> </span> +1 123 456 7890
                            </Link>
                        </div>
                    </div>
                </div>
                <span className="text-vertical">24/7 EMERGENCY SERVICE</span>
                <ul className="dz-social">
                    <li><Link href="https://www.instagram.com/dexignzone" target="_blank"> 
                            <i className="fa-brands fa-instagram" />
                        </Link>
                    </li>
                    <li><Link href="https://www.facebook.com/dexignzone" target="_blank"> 
                            <i className="fa-brands fa-facebook-f" />
                        </Link>
                    </li>
                    <li><Link href="https://x.com/dexignzone" target="_blank"> 
                            <i className="fa-brands fa-x-twitter" />
                        </Link>
                    </li>
                    <li><Link href="https://www.youtube.com/@dexignzone" target="_blank"> 
                            <i className="fa-brands fa-youtube" />
                        </Link>
                    </li>
                </ul>
            </div>
        </>
    )
}
export default PageBanner;