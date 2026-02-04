// booking.js — handles client-side booking logic, validation, and storage
(function () {
    function qs(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
    }

    document.addEventListener('DOMContentLoaded', function () {
        const form = document.getElementById('bookingForm');
        const confirmation = document.getElementById('confirmation');
        const emergencyBanner = document.getElementById('emergencyBanner');
        const emergencyField = document.getElementById('emergencyField');
        const videoCheckbox = document.getElementById('videoCall');
        const videoActions = document.getElementById('videoActions');

        // Preselect service type if passed via ?type=pet or caretaking/people
        const type = qs('type');
        if (type) {
            const select = document.getElementById('serviceType');
            if (select) {
                if (type === 'pet') select.value = 'pet';
                else if (type === 'caretaking' || type === 'people') select.value = 'caretaking';
                else select.value = '';
            }
        }

        // Handle emergency & video query params
        const isEmergency = !!qs('emergency');
        const wantsVideo = !!qs('video');

        if (isEmergency && emergencyBanner && emergencyField) {
            emergencyBanner.style.display = 'block';
            emergencyField.value = '1';

            // Auto-check video if emergency generally implies urgency
            if (videoCheckbox) {
                videoCheckbox.checked = true;
                // Add visual cue
                videoCheckbox.parentElement.style.color = '#c53030';
                videoCheckbox.parentElement.style.fontWeight = 'bold';
            }
        }

        if (wantsVideo && videoCheckbox) {
            videoCheckbox.checked = true;
        }

        // --- Nearby caretakers dataset and UI ---
        const caretakersPanel = document.getElementById('caretakersPanel');
        const caretakersList = document.getElementById('caretakersList');
        const selectedCaretakerBox = document.getElementById('selectedCaretaker');

        // Sample caretakers data
        const caretakers = [
            { id: 'c1', name: 'Anna Rivera', phone: '+1-800-123-4567', email: 'anna@caretakers.example', distanceKm: 2.1, location: 'Maple St, Neighborhood A', verified: true, role: 'Certified Caretaker' },
            { id: 'c2', name: 'Ben Carter', phone: '+1-800-765-4321', email: 'ben@caretakers.example', distanceKm: 3.5, location: 'Pine Ave, Neighborhood B', verified: true, role: 'Pet Sitter' },
            { id: 'c3', name: 'CareBridge Team (On-call)', phone: '+1-800-PET-HELP', email: 'oncall@carebridge.example', distanceKm: 0.5, location: 'CareBridge HQ', verified: true, role: 'Emergency Response', isEmergency: true }
        ];

        function renderCaretakers() {
            if (!caretakersList) return;
            caretakersList.innerHTML = '';

            // If emergency, prioritize emergency team
            const sortedCaretakers = isEmergency
                ? [...caretakers].sort((a, b) => (b.isEmergency ? 1 : 0) - (a.isEmergency ? 1 : 0))
                : caretakers;

            sortedCaretakers.forEach(function (c) {
                const item = document.createElement('div');
                item.className = 'caretaker-item';
                // Auto-select emergency team if emergency
                if (isEmergency && c.isEmergency) {
                    setTimeout(() => selectCaretaker(c), 100);
                }

                item.innerHTML = `
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.2rem;">
                            <strong>${c.name}</strong>
                            ${c.verified ? '<span style="font-size:0.8rem; background:#e6fffa; color:#2c7a7b; padding:2px 6px; border-radius:4px;">Verified</span>' : ''}
                            ${c.isEmergency ? '<span style="font-size:0.8rem; background:#fff5f5; color:#c53030; padding:2px 6px; border-radius:4px;">Emergency Team</span>' : ''}
                        </div>
                        <div style="font-size:0.9rem; color:#718096; margin-bottom:0.2rem;">${c.role}</div>
                        <div style="font-size:0.85rem; color:#a0aec0;">${c.location} • ${c.distanceKm} km</div>
                    </div>
                    <div style="display:flex; gap:0.5rem; flex-direction: column; min-width: 100px;">
                        <button type="button" class="btn btn-primary select-caretaker" data-id="${c.id}" style="padding:0.5rem 1rem; font-size:0.9rem;">Select</button>
                        <button type="button" class="btn" style="padding:0.4rem 1rem; font-size:0.85rem; background:transparent; color:#667eea; border:1px solid #e2e8f0;" onclick="alert('Profile view coming soon!')">View Profile</button>
                    </div>
                `;
                caretakersList.appendChild(item);
            });

            // attach select listeners
            const selects = caretakersList.querySelectorAll('.select-caretaker');
            selects.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    const id = btn.getAttribute('data-id');
                    const c = caretakers.find(x => x.id === id);
                    if (!c) return;
                    selectCaretaker(c);
                });
            });
        }

        function selectCaretaker(c) {
            // show selection UI
            if (selectedCaretakerBox) {
                selectedCaretakerBox.style.display = 'block';
                selectedCaretakerBox.style.background = '#ebf8ff';
                selectedCaretakerBox.style.border = '1px solid #bee3f8';
                selectedCaretakerBox.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong>Selected: ${c.name}</strong>
                            <div style="font-size:0.9rem;color:#4a5568;">${c.location}</div>
                        </div>
                        <button type="button" class="btn" onclick="document.getElementById('selectedCaretaker').style.display='none'; document.getElementById('caretakerId').value='';" style="padding:0.2rem 0.5rem; height:auto; background:none; color:#e53e3e;">Remove</button>
                    </div>
                `;
            }

            // set hidden caretaker inputs (create if missing)
            let hidId = document.getElementById('caretakerId');
            if (!hidId) {
                hidId = document.createElement('input'); hidId.type = 'hidden'; hidId.id = 'caretakerId'; hidId.name = 'caretakerId';
                form.appendChild(hidId);
            }
            let hidName = document.getElementById('caretakerName');
            if (!hidName) {
                hidName = document.createElement('input'); hidName.type = 'hidden'; hidName.id = 'caretakerName'; hidName.name = 'caretakerName';
                form.appendChild(hidName);
            }
            hidId.value = c.id;
            hidName.value = c.name;

            // visually highlight selected in list
            const items = caretakersList.querySelectorAll('.caretaker-item');
            items.forEach(function (it) { it.classList.remove('caretaker-selected'); });
            const match = Array.from(items).find(it => it.querySelector('.select-caretaker') && it.querySelector('.select-caretaker').getAttribute('data-id') === c.id);
            if (match) match.classList.add('caretaker-selected');
        }

        // Show caretakers panel when caretaking selected
        const serviceSelect = document.getElementById('serviceType');
        if (serviceSelect) {
            serviceSelect.addEventListener('change', function () {
                if (serviceSelect.value === 'caretaking') {
                    if (caretakersPanel) caretakersPanel.style.display = 'block';
                    renderCaretakers();
                } else {
                    if (caretakersPanel) caretakersPanel.style.display = 'none';
                }
            });
            // If page already preselected caretaking via query param, render now
            if (serviceSelect.value === 'caretaking') {
                if (caretakersPanel) caretakersPanel.style.display = 'block';
                renderCaretakers();
            }
        }

        // --- VALIDATION & SUBMISSION ---

        function showError(input, message) {
            // Remove existing error if any
            const existing = input.parentNode.querySelector('.error-message');
            if (existing) existing.remove();

            input.classList.add('error');
            const msg = document.createElement('small');
            msg.className = 'error-message';
            msg.textContent = message;
            input.parentNode.appendChild(msg);
        }

        function clearError(input) {
            input.classList.remove('error');
            const existing = input.parentNode.querySelector('.error-message');
            if (existing) existing.remove();
        }

        function validateInput(input) {
            const val = input.value.trim();
            const name = input.name;
            let isValid = true;
            let msg = '';

            if (input.hasAttribute('required') && !val) {
                isValid = false;
                msg = 'This field is required';
            } else if (name === 'contact') {
                // Determine if phone or email
                const isEmail = val.includes('@');
                if (isEmail) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(val)) {
                        isValid = false;
                        msg = 'Please enter a valid email address';
                    }
                } else {
                    // Basic phone validation (digits, dashes, +, space, parens)
                    const phoneRegex = /^[\d\s\+\-\(\)]{7,}$/;
                    if (!phoneRegex.test(val)) {
                        isValid = false;
                        msg = 'Please enter a valid phone number';
                    }
                }
            } else if (name === 'date') {
                const selectedDate = new Date(val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    isValid = false;
                    msg = 'Date cannot be in the past';
                }
            }

            if (!isValid) {
                showError(input, msg);
            } else {
                clearError(input);
            }
            return isValid;
        }

        // Attach live validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', () => validateInput(input));
            input.addEventListener('input', () => clearError(input));
        });

        form.addEventListener('submit', function (ev) {
            ev.preventDefault();

            // Validate all fields
            let isFormValid = true;
            inputs.forEach(input => {
                if (!validateInput(input)) isFormValid = false;
            });

            if (!isFormValid) {
                showMessage('Please fix errors in the form.', true);
                // scroll to first error
                const firstError = document.querySelector('.error');
                if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

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
                createdAt: new Date().toISOString()
            };

            // Save and feedback
            try {
                const key = 'carebridge_bookings';
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                existing.push(booking);
                localStorage.setItem(key, JSON.stringify(existing));

                // Confetti Explosion
                if (window.confetti) {
                    var count = 200;
                    var defaults = {
                        origin: { y: 0.7 }
                    };

                    function fire(particleRatio, opts) {
                        confetti(Object.assign({}, defaults, opts, {
                            particleCount: Math.floor(count * particleRatio)
                        }));
                    }

                    fire(0.25, { spread: 26, startVelocity: 55, });
                    fire(0.2, { spread: 60, });
                    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
                    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
                    fire(0.1, { spread: 120, startVelocity: 45, });
                }

                form.reset();

                // Show success
                form.style.display = 'none'; // Hide form after successful submit

                // Success Message
                const successMsg = document.createElement('div');
                successMsg.style.textAlign = 'center';
                successMsg.innerHTML = `
                    <div style="font-size:3rem; margin-bottom:1rem;">🎉</div>
                    <h3 style="color:#2d3748; margin-bottom:1rem;">Booking Confirmed!</h3>
                    <p style="color:#718096; margin-bottom:2rem;">Thank you for trusting CareBridge. We have sent a confirmation to <strong>${booking.contact}</strong>.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">Book Another</button>
                    <button class="btn btn-secondary" style="color:#667eea; border-color:#667eea; margin-left:1rem;" onclick="window.location.href='index.html'">Return Home</button>
                `;

                const wrapper = document.querySelector('.booking-wrapper');
                wrapper.innerHTML = '';
                wrapper.appendChild(successMsg);

                // If emergency video call
                if (booking.videoCall) {
                    const room = booking.id;
                    // Create container for jitsi
                    const videoContainer = document.createElement('div');
                    videoContainer.id = 'jitsi-container';
                    successMsg.appendChild(videoContainer);

                    // Initialize Jitsi Meet Embedded
                    if (window.JitsiMeetExternalAPI) {
                        const domain = 'meet.jit.si';
                        const options = {
                            roomName: room,
                            width: '100%',
                            height: 500,
                            parentNode: videoContainer,
                            userInfo: {
                                displayName: booking.fullName
                            },
                            configOverwrite: { startWithAudioMuted: false },
                            interfaceConfigOverwrite: {
                                SHOW_JITSI_WATERMARK: false,
                                SHOW_WATERMARK_FOR_GUESTS: false
                            }
                        };
                        const api = new JitsiMeetExternalAPI(domain, options);

                        // Add a note above it
                        const note = document.createElement('p');
                        note.style.color = '#c53030';
                        note.style.fontWeight = 'bold';
                        note.style.marginTop = '1rem';
                        note.textContent = '🚨 Connecting you to emergency support...';
                        successMsg.insertBefore(note, videoContainer);
                    } else {
                        // Fallback if script failed to load
                        videoContainer.innerHTML = `<p style="padding:2rem;color:red;">Could not load video system. Please use this <a href="https://meet.jit.si/${room}" target="_blank">Direct Link</a></p>`;
                    }
                }

            } catch (err) {
                console.error(err);
                showMessage('Failed to save booking. Please try again.', true);
            }
        });

        function showMessage(msg, isError) {
            confirmation.style.display = 'block';
            confirmation.textContent = msg;
            if (isError) {
                confirmation.style.background = '#fff5f5';
                confirmation.style.color = '#c53030';
                confirmation.style.borderLeftColor = '#fc8181';
            } else {
                confirmation.style.background = '#f0fff4';
                confirmation.style.color = '#22543d';
                confirmation.style.borderLeftColor = '#48bb78';
            }
            setTimeout(function () { confirmation.style.display = 'none'; }, 6000);
        }
    });
})();
