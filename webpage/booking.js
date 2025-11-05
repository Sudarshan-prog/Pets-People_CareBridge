// booking.js — handles simple client-side booking storage and confirmation
(function() {
    function qs(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('bookingForm');
        const confirmation = document.getElementById('confirmation');
        const emergencyBanner = document.getElementById('emergencyBanner');
        const emergencyField = document.getElementById('emergencyField');
        const videoCheckbox = document.getElementById('videoCall');
        const videoActions = document.getElementById('videoActions');

       
        const type = qs('type');
        if (type) {
            const select = document.getElementById('serviceType');
            if (select) {
                if (type === 'pet') select.value = 'pet';
                else if (type === 'caretaking' || type === 'people') select.value = 'caretaking';
                else select.value = '';
            }
        }

        
        const isEmergency = !!qs('emergency');
        const wantsVideo = !!qs('video');
        if (isEmergency && emergencyBanner && emergencyField) {
            emergencyBanner.style.display = 'block';
            emergencyField.value = '1';
        }
        if (wantsVideo && videoCheckbox) {
            videoCheckbox.checked = true;
        }

    
        const caretakersPanel = document.getElementById('caretakersPanel');
        const caretakersList = document.getElementById('caretakersList');
        const selectedCaretakerBox = document.getElementById('selectedCaretaker');

        const caretakers = [
            { id: 'c1', name: 'Anna Rivera', phone: '+1-800-123-4567', email: 'anna@caretakers.example', distanceKm: 2.1, location: 'Maple St, Neighborhood A' },
            { id: 'c2', name: 'Ben Carter', phone: '+1-800-765-4321', email: 'ben@caretakers.example', distanceKm: 3.5, location: 'Pine Ave, Neighborhood B' },
            { id: 'c3', name: 'CareBridge Team (On-call)', phone: '+1-800-PET-HELP', email: 'oncall@carebridge.example', distanceKm: 0.5, location: 'CareBridge HQ' }
        ];

        function renderCaretakers() {
            if (!caretakersList) return;
            caretakersList.innerHTML = '';
            caretakers.forEach(function(c) {
                const item = document.createElement('div');
                item.className = 'caretaker-item';
                item.innerHTML = `
                    <div>
                        <strong>${c.name}</strong>
                        <div style="font-size:0.9rem; color:#718096;">${c.location} • ${c.distanceKm} km</div>
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <button type="button" class="btn" data-id="${c.id}">Call</button>
                        <button type="button" class="btn btn-primary select-caretaker" data-id="${c.id}">Select</button>
                    </div>
                `;
                caretakersList.appendChild(item);

                
                const callBtn = item.querySelector('.btn');
                if (callBtn) callBtn.addEventListener('click', function() { window.location.href = 'tel:' + c.phone; });
            });

            
            const selects = caretakersList.querySelectorAll('.select-caretaker');
            selects.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    const id = btn.getAttribute('data-id');
                    const c = caretakers.find(x => x.id === id);
                    if (!c) return;
                    selectCaretaker(c);
                });
            });
        }

        function selectCaretaker(c) {
            
            if (selectedCaretakerBox) {
                selectedCaretakerBox.style.display = 'block';
                selectedCaretakerBox.innerHTML = `<strong>Selected: ${c.name}</strong><div style="font-size:0.95rem;color:#4a5568;">${c.location} • ${c.distanceKm} km • ${c.phone}</div>`;
            }
            
            const contactField = document.getElementById('contact');
            if (contactField && c.phone) contactField.value = c.phone;

            
            let hidId = document.getElementById('caretakerId');
            if (!hidId) {
                hidId = document.createElement('input'); hidId.type='hidden'; hidId.id='caretakerId'; hidId.name='caretakerId';
                form.appendChild(hidId);
            }
            let hidName = document.getElementById('caretakerName');
            if (!hidName) {
                hidName = document.createElement('input'); hidName.type='hidden'; hidName.id='caretakerName'; hidName.name='caretakerName';
                form.appendChild(hidName);
            }
            let hidLoc = document.getElementById('caretakerLocation');
            if (!hidLoc) {
                hidLoc = document.createElement('input'); hidLoc.type='hidden'; hidLoc.id='caretakerLocation'; hidLoc.name='caretakerLocation';
                form.appendChild(hidLoc);
            }
            hidId.value = c.id;
            hidName.value = c.name;
            hidLoc.value = c.location;

            
            const items = caretakersList.querySelectorAll('.caretaker-item');
            items.forEach(function(it) { it.classList.remove('caretaker-selected'); });
            const match = Array.from(items).find(it => it.querySelector('.select-caretaker') && it.querySelector('.select-caretaker').getAttribute('data-id') === c.id);
            if (match) match.classList.add('caretaker-selected');
        }

        
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            serviceSelect.addEventListener('change', function() {
                if (serviceSelect.value === 'caretaking') {
                    if (caretakersPanel) caretakersPanel.style.display = 'block';
                    renderCaretakers();
                } else {
                    if (caretakersPanel) caretakersPanel.style.display = 'none';
                }
            });
            
            if (serviceSelect.value === 'caretaking') {
                if (caretakersPanel) caretakersPanel.style.display = 'block';
                renderCaretakers();
            }
        }

        form.addEventListener('submit', function(ev) {
            ev.preventDefault();
            const booking = {
                id: 'b_' + Date.now(),
                fullName: form.fullName.value.trim(),
                contact: form.contact.value.trim(),
                serviceType: form.serviceType.value,
                petType: form.petType.value.trim(),
                date: form.date.value,
                time: form.time.value,
                notes: form.notes.value.trim(),
                emergency: emergencyField && emergencyField.value === '1',
                videoCall: videoCheckbox ? !!videoCheckbox.checked : false,
                includeEduHealth: (document.getElementById('eduHealth') ? !!document.getElementById('eduHealth').checked : false),
                
                caretakerId: (document.getElementById('caretakerId') ? document.getElementById('caretakerId').value : ''),
                caretakerName: (document.getElementById('caretakerName') ? document.getElementById('caretakerName').value : ''),
                caretakerLocation: (document.getElementById('caretakerLocation') ? document.getElementById('caretakerLocation').value : ''),
                createdAt: new Date().toISOString()
            };

            
            if (!booking.fullName || !booking.contact || !booking.serviceType || !booking.date || !booking.time) {
                showMessage('Please fill required fields.', true);
                return;
            }

            
            try {
                const key = 'carebridge_bookings';
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push(booking);
                localStorage.setItem(key, JSON.stringify(existing));
                showMessage('Booking saved — thank you! We saved this booking locally for demo purposes.');
                form.reset();

               
                if (booking.videoCall && videoActions) {
                    const room = booking.id;
                    const meetUrl = 'https://meet.jit.si/' + encodeURIComponent(room);
                    videoActions.innerHTML = '';
                    const info = document.createElement('div');
                    info.style.marginBottom = '0.5rem';
                    info.style.color = '#22543d';
                    info.textContent = 'Video call requested. Start the emergency video call when you are ready:';
                    const a = document.createElement('a');
                    a.href = meetUrl;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.className = 'btn btn-primary';
                    a.style.display = 'inline-block';
                    a.style.marginTop = '0.4rem';
                    a.textContent = 'Start Emergency Video Call';
                    videoActions.appendChild(info);
                    videoActions.appendChild(a);
                    videoActions.style.display = 'block';
                }

                
                if (booking.includeEduHealth) {
                    const eduNote = document.createElement('div');
                    eduNote.style.marginTop = '0.75rem';
                    eduNote.style.padding = '0.75rem';
                    eduNote.style.background = '#fffaf0';
                    eduNote.style.color = '#744210';
                    eduNote.style.borderRadius = '8px';
                    eduNote.textContent = 'Education & Health details will be included with your booking.';
                    confirmation.parentNode.insertBefore(eduNote, confirmation.nextSibling);
                    setTimeout(function() { if (eduNote.parentNode) eduNote.parentNode.removeChild(eduNote); }, 6000);
                }
            } catch (err) {
                console.error(err);
                showMessage('Failed to save booking in this browser.', true);
            }
        });

        function showMessage(msg, isError) {
            confirmation.style.display = 'block';
            confirmation.textContent = msg;
            if (isError) {
                confirmation.style.background = '#fff5f5';
                confirmation.style.color = '#742a2a';
            } else {
                confirmation.style.background = '#f0fff4';
                confirmation.style.color = '#22543d';
            }
            setTimeout(function() { confirmation.style.display = 'none'; }, 6000);
        }
    });
})();
