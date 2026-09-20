
                function initMapaICDE() {
                    const ubicacion = { lat: 2.9462963, lng: -75.2910909 };

                    const estiloOscuro = [];
                    const mapa = new google.maps.Map(document.getElementById("mapaCutom"), {
                        zoom: 15,
                        center: ubicacion,
                        styles: estiloOscuro,
                        disableDefaultUI: true,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoomControl: true,
                        zoomControlOptions: {
                            position: google.maps.ControlPosition.RIGHT_BOTTOM
                        }
                    });

                    // Pin con logo usando OverlayView para soportar imagen externa
                    class PinICDE extends google.maps.OverlayView {
                        constructor(position) {
                            super();
                            this.position = position;
                            this.div = null;
                        }
                        onAdd() {
                            const div = document.createElement('div');
                            div.style.cssText = `
                                position: absolute;
                                width: 52px;
                                height: 64px;
                                cursor: pointer;
                                transform: translate(-50%, -100%);
                            `;
                            div.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="52" height="64" viewBox="0 0 52 64" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.5));display:block;">
                                    <path d="M26 0C12 0 0 12 0 26c0 18 26 38 26 38S52 44 52 26C52 12 40 0 26 0z" fill="#0d0b08" stroke="#d4a84b" stroke-width="1.8"/>
                                    <circle cx="26" cy="24" r="15" fill="#0d0b08"/>
                                </svg>
                                <img loading="lazy" src="https://i.imgur.com/YbnRomr.png"
                                     style="position:absolute;top:9px;left:50%;transform:translateX(-50%);width:30px;height:30px;object-fit:contain;"
                                     alt="ICDE"/>
                            `;
                            this.div = div;
                            const panes = this.getPanes();
                            panes.overlayMouseTarget.appendChild(div);
                        }
                        draw() {
                            const projection = this.getProjection();
                            const point = projection.fromLatLngToDivPixel(this.position);
                            if (point && this.div) {
                                this.div.style.left = point.x + 'px';
                                this.div.style.top = point.y + 'px';
                            }
                        }
                        onRemove() {
                            if (this.div) { this.div.parentNode.removeChild(this.div); this.div = null; }
                        }
                    }

                    const pin = new PinICDE(ubicacion);
                    pin.setMap(mapa);
                }
            