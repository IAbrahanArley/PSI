import { StaticImageData } from "next/image";
import Link from "next/link";

interface Props{
    title : string,
    bnrimage : string | StaticImageData
}

function PageBanner({ title, bnrimage } : Props) {
    return (
        <>
            <div
                className="dz-bnr-inr dz-banner-dark overlay-black-middle dz-bnr-inr-md"
                style={{
                    backgroundImage: `url(${bnrimage})`,
                    backgroundPosition: "center bottom",
                    opacity: 0.95,
                }}
            >
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
            </div>
        </>
    )
}
export default PageBanner;